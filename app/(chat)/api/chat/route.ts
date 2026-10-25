import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth } from "@/app/(auth)/auth";
import { getModelAvailability, resolvePairModel } from "@/lib/ai/models";
import { oregonFiguresTool } from "@/lib/ai/oregon-figures";
import {
  answerInstructions,
  openWebSearch,
  TROVE_NAME,
  troveBrief,
} from "@/lib/ai/pair";
import { getRequestPromptFromHints, type RequestHints } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { accessDecision, startOfUtcMonth } from "@/lib/billing/access";
import { costMicrodollars } from "@/lib/billing/cost";
import { hardcodedBudgetMicro } from "@/lib/billing/plans";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getBillingAccount,
  getChatById,
  getMessageCountSince,
  getMessagesByChatId,
  getSpendMicroSince,
  getUserById,
  recordUsageCharge,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage, WaitingStatusData } from "@/lib/types";
import {
  convertToUIMessages,
  generateUUID,
  getTextFromMessage,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 300;

const HEALTH_CHECK_DELAY_MS = 9000;

function isModelStreamActivity(chunk: { type: string }) {
  return !["start", "start-step", "finish-step", "finish", "raw"].includes(
    chunk.type
  );
}

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch {
    return null;
  }
}

function chatErrorText(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Free tier users do not have access")) {
    return "Claude and Grok need paid AI Gateway credits before they can answer. Add credits, then ask again.";
  }
  if (message.includes("AI Gateway requires a valid credit card")) {
    return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
  }
  return "Oops, an error occurred!";
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const {
      adversaryModelId,
      answerModelId,
      id,
      message,
      messages,
      selectedVisibilityType,
    } = requestBody;
    const answer = resolvePairModel(answerModelId, "answer");
    const adversary = resolvePairModel(adversaryModelId, "adversary");

    const [botIdResult, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (botIdResult?.isBot) {
      return new ChatbotError("forbidden:api").toResponse();
    }

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    await checkIpRateLimit(ipAddress(request));

    const [account, billing] = await Promise.all([
      getUserById(session.user.id),
      getBillingAccount(session.user.id),
    ]);
    const storedPlan =
      billing?.plan === "forty" ||
      billing?.plan === "hundred" ||
      billing?.plan === "unlimited"
        ? billing.plan
        : null;
    const openPlan =
      storedPlan &&
      (billing?.status === "active" || billing?.status === "trialing")
        ? storedPlan
        : null;
    const fixedBudget = hardcodedBudgetMicro(account?.email);
    const periodStart = openPlan
      ? (billing?.currentPeriodStart ?? startOfUtcMonth())
      : fixedBudget === null
        ? undefined
        : startOfUtcMonth();
    const [messageCount, spendMicro] = await Promise.all([
      getMessageCountSince({ id: session.user.id }),
      periodStart
        ? getSpendMicroSince({ since: periodStart, userId: session.user.id })
        : Promise.resolve(0),
    ]);
    const decision = accessDecision({
      email: account?.email,
      messageCount,
      plan: openPlan,
      spendMicro,
      status: openPlan ? (billing?.status ?? null) : null,
    });

    if (decision === "paywall") {
      return new ChatbotError("forbidden:billing").toResponse();
    }
    if (decision === "cap") {
      return new ChatbotError("rate_limit:billing").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: ReturnType<typeof generateTitleFromUserMessage> | null =
      null;
    const incognito = selectedVisibilityType === "incognito";

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user" && !incognito) {
      await saveChat({
        id,
        title: "New chat",
        userId: session.user.id,
        visibility: selectedVisibilityType === "private" ? "private" : "public",
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      city,
      country,
      latitude,
      longitude,
    };

    if (message?.role === "user" && !incognito) {
      await saveMessages({
        messages: [
          {
            attachments: [],
            chatId: id,
            createdAt: new Date(),
            id: message.id,
            parts: message.parts,
            role: "user",
          },
        ],
      });
    }

    const modelMessages = await convertToModelMessages(uiMessages);

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const answerName = answer.shortName ?? answer.name;
        const adversaryName = TROVE_NAME;
        let hasModelActivity = false;
        let healthCheckTimer: ReturnType<typeof setTimeout> | undefined;

        const clearHealthCheckTimer = () => {
          if (healthCheckTimer) {
            clearTimeout(healthCheckTimer);
          }
        };

        const writeWaitingStatus = (
          phase: WaitingStatusData["phase"],
          answerMessage: string,
          adversaryMessage: string
        ) => {
          if (hasModelActivity && phase !== "thinking") {
            return;
          }
          dataStream.write({
            data: {
              message: `${answerName}: ${answerMessage}`,
              modelId: answer.id,
              modelName: answerName,
              phase,
              workers: [
                {
                  message: answerMessage,
                  modelId: answer.id,
                  modelName: answerName,
                  provider: answer.provider,
                  role: "answer",
                },
                {
                  message: adversaryMessage,
                  modelId: adversary.id,
                  modelName: adversaryName,
                  provider: adversary.provider,
                  role: "adversary",
                },
              ],
            },
            transient: true,
            type: "data-waiting-status",
          });
        };

        writeWaitingStatus("waiting", "Answering...", "Checking Oregon...");

        healthCheckTimer = setTimeout(() => {
          getModelAvailability(answer.id)
            .then((availability) => {
              writeWaitingStatus(
                availability === "impacted" ? "health" : "still-waiting",
                availability === "impacted"
                  ? "May be slow right now..."
                  : "Still working...",
                "Checking Oregon..."
              );
            })
            .catch(() => {
              writeWaitingStatus(
                "still-waiting",
                "Still working...",
                "Checking Oregon..."
              );
            });
        }, HEALTH_CHECK_DELAY_MS);

        const markModelActive = () => {
          if (hasModelActivity) {
            return;
          }
          hasModelActivity = true;
          clearHealthCheckTimer();
          writeWaitingStatus("thinking", "Writing...", "Checking Oregon...");
        };

        const stopWaitingStatus = () => {
          hasModelActivity = true;
          clearHealthCheckTimer();
        };

        const question = message ? getTextFromMessage(message) : "";
        const brief =
          question && !isToolApprovalFlow
            ? await troveBrief({
                adversaryModelId: adversary.id,
                question,
              })
            : { charges: [], filed: "", note: "" };
        await Promise.all(
          brief.charges.map((charge) =>
            recordUsageCharge({
              costMicro: costMicrodollars({
                modelId: charge.modelId,
                providerMetadata: charge.providerMetadata,
                usage: charge.usage as Parameters<
                  typeof costMicrodollars
                >[0]["usage"],
              }),
              modelId: charge.modelId,
              userId: session.user.id,
            }).catch(() => undefined)
          )
        );

        const result = streamText({
          activeTools: [
            "web_search",
            "oregon_figures",
            "getWeather",
            "createDocument",
            "editDocument",
            "updateDocument",
            "requestSuggestions",
          ],
          instructions: answerInstructions({
            answerName,
            briefing: brief.note,
            record: brief.filed,
            requestPrompt: getRequestPromptFromHints(requestHints),
            toolPrompt:
              "Document tools are only for a file the person explicitly asked you to create.",
          }),
          messages: modelMessages,
          model: getLanguageModel(answer.id),
          onAbort() {
            stopWaitingStatus();
          },
          onChunk({ chunk }) {
            if (isModelStreamActivity(chunk)) {
              markModelActive();
            }
          },
          onEnd() {
            stopWaitingStatus();
          },
          onError() {
            stopWaitingStatus();
          },
          onFinish({ providerMetadata, usage }) {
            recordUsageCharge({
              costMicro: costMicrodollars({
                modelId: answer.id,
                providerMetadata,
                usage,
              }),
              modelId: answer.id,
              userId: session.user.id,
            }).catch(() => undefined);
          },
          providerOptions: answer.gatewayOrder
            ? { gateway: { order: answer.gatewayOrder } }
            : undefined,
          stopWhen: isStepCount(8),
          telemetry: {
            functionId: "stream-text",
            isEnabled: isProductionEnvironment,
          },
          tools: {
            ...openWebSearch(),
            createDocument: createDocument({
              dataStream,
              modelId: answer.id,
              session,
            }),
            editDocument: editDocument({ dataStream, session }),
            getWeather,
            oregon_figures: oregonFiguresTool(),
            requestSuggestions: requestSuggestions({
              dataStream,
              modelId: answer.id,
              session,
            }),
            updateDocument: updateDocument({
              dataStream,
              modelId: answer.id,
              session,
            }),
          },
        });

        dataStream.merge(
          toUIMessageStream({
            onError: (error) => {
              console.error(
                "chat model error",
                error instanceof Error ? error.message : "unknown"
              );
              return chatErrorText(error);
            },
            sendReasoning: false,
            stream: result.stream,
          })
        );

        if (titlePromise) {
          try {
            const titled = await titlePromise;
            dataStream.write({ data: titled.title, type: "data-chat-title" });
            if (!incognito) {
              updateChatTitleById({ chatId: id, title: titled.title });
            }
            await recordUsageCharge({
              costMicro: costMicrodollars({
                modelId: titled.modelId,
                providerMetadata: titled.providerMetadata,
                usage: titled.usage,
              }),
              modelId: titled.modelId,
              userId: session.user.id,
            });
          } catch {
            /* non-fatal */
          }
        }
      },
      generateId: generateUUID,
      onEnd: async ({ messages: finishedMessages }) => {
        if (incognito) {
          return;
        }
        if (isToolApprovalFlow) {
          await Promise.all(
            finishedMessages.map(async (finishedMsg) => {
              const existingMsg = uiMessages.find(
                (m) => m.id === finishedMsg.id
              );
              if (existingMsg) {
                await updateMessage({
                  id: finishedMsg.id,
                  parts: finishedMsg.parts,
                });
                return;
              }

              await saveMessages({
                messages: [
                  {
                    attachments: [],
                    chatId: id,
                    createdAt: new Date(),
                    id: finishedMsg.id,
                    parts: finishedMsg.parts,
                    role: finishedMsg.role,
                  },
                ],
              });
            })
          );
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              attachments: [],
              chatId: id,
              createdAt: new Date(),
              id: currentMessage.id,
              parts: currentMessage.parts,
              role: currentMessage.role,
            })),
          });
        }
      },
      onError: (error) => {
        console.error(
          "chat model error",
          error instanceof Error ? error.message : "unknown"
        );
        return chatErrorText(error);
      },
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    });

    return createUIMessageStreamResponse({
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ chatId: id, streamId });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch {
          /* non-critical */
        }
      },
      stream,
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatbotError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}

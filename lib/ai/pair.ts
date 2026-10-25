import { gateway, generateText, isStepCount, type ModelMessage } from "ai";
import { figuresForQuestion } from "./gateway-readings";
import { type ChatModel, resolvePairModel } from "./models";
import { oregonFiguresTool } from "./oregon-figures";
import { getLanguageModel } from "./providers";

export const TROVE_NAME = "Trove";

const TROVE_STEPS = 3;
const TROVE_WAIT_MS = 10_000;

export type PairCharge = {
  modelId: string;
  providerMetadata: unknown;
  usage: unknown;
};

export function openWebSearch() {
  return {
    web_search: gateway.tools.perplexitySearch(),
  };
}

export function troveTools() {
  return {
    ...openWebSearch(),
    oregon_figures: oregonFiguresTool(),
  };
}

const chartRule = `When the person asks for a chart, graph, or plot, draw it before the prose. Do not describe a chart you have not drawn, and do not refuse because the question is broad. Each chart is its own fence:

\`\`\`chart
{"type":"line","title":"Short title","unit":"Unit","x":["2016","2026"],"series":[{"name":"Series","data":[1,2]}]}
\`\`\`

type is "line" or "bar". Use separate charts when the units differ. For grouped bars, put one series per group. A caveat is one or two sentences after the chart.`;

function answerSearch(name: string) {
  return `You are ${name}, a frontier model. Use the capabilities you already have: web search, charts, tables, and code. Search the live web with web_search before you rely on memory for a rate, price, law, date, news item, or local condition. Search as many times as the question needs, with no site list. ${chartRule} Write a direct draft. Trove will challenge the Oregon business side.`;
}

function adversarySearch() {
  return `You are Trove. You are the Oregon business model working beside a frontier model. Your subject is the owner's decision: hiring, rent, a second location, licenses, power, and the move that would be a mistake. Search the live web with web_search as many times as the challenge needs, with no site list. When the question or the draft depends on an actual Oregon number, call oregon_figures before you accept or reject it. Attack a wrong number, a stale date, or a bad comparison. If the person asked for a chart, do not veto it. Name the series, the place, and the unit so the chart can be drawn. If the web is newer than the figures, say both.`;
}

function gatewayOptions(model: ChatModel) {
  return model.gatewayOrder
    ? { gateway: { order: model.gatewayOrder } }
    : undefined;
}

export async function troveBrief({
  adversaryModelId,
  question,
}: {
  adversaryModelId?: string;
  question: string;
}) {
  const filed = figuresForQuestion(question);
  const adversary = resolvePairModel(adversaryModelId, "adversary");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TROVE_WAIT_MS);
  try {
    const result = await generateText({
      abortSignal: controller.signal,
      instructions:
        "You are Trove. Do not write an essay. If the person wants a chart, output only chart fences using the chart format, then one caveat sentence. Otherwise write at most four sentences: the local numbers that matter, and one thing a statewide answer would get wrong. Call oregon_figures or web_search at most once each.",
      model: getLanguageModel(adversary.id),
      prompt: `Question:\n${question}\n\nFigures on file:\n${filed}`,
      providerOptions: gatewayOptions(adversary),
      stopWhen: isStepCount(TROVE_STEPS),
      tools: troveTools(),
    });
    return {
      charges: [
        {
          modelId: adversary.id,
          providerMetadata: result.providerMetadata,
          usage: result.usage,
        },
      ] satisfies PairCharge[],
      filed,
      note: result.text,
    };
  } catch (error) {
    console.error(
      "trove brief error",
      error instanceof Error ? error.message : "unknown"
    );
    return { charges: [], filed, note: "" };
  } finally {
    clearTimeout(timer);
  }
}

export async function preparePair({
  adversaryModelId,
  answerModelId,
  messages,
  onStatus,
  question,
}: {
  adversaryModelId?: string;
  answerModelId?: string;
  messages: ModelMessage[];
  onStatus?: (phase: "adversary") => void;
  question: string;
}) {
  const answer = resolvePairModel(answerModelId, "answer");
  const adversary = resolvePairModel(adversaryModelId, "adversary");
  const answerName = answer.shortName ?? answer.name;
  const charges: PairCharge[] = [];
  let draft = "";
  let challenge = "";

  try {
    const drafted = await generateText({
      instructions: answerSearch(answerName),
      messages,
      model: getLanguageModel(answer.id),
      providerOptions: gatewayOptions(answer),
      stopWhen: isStepCount(TROVE_STEPS),
      tools: openWebSearch(),
    });
    draft = drafted.text;
    charges.push({
      modelId: answer.id,
      providerMetadata: drafted.providerMetadata,
      usage: drafted.usage,
    });
  } catch (error) {
    console.error(
      "answer draft error",
      error instanceof Error ? error.message : "unknown"
    );
  }

  onStatus?.("adversary");

  try {
    const challenged = await generateText({
      instructions: adversarySearch(),
      model: getLanguageModel(adversary.id),
      prompt: draft
        ? `Question:\n${question}\n\n${answerName}'s draft:\n${draft}`
        : `Question:\n${question}\n\n${answerName} did not produce a draft. Challenge the question directly.`,
      providerOptions: gatewayOptions(adversary),
      stopWhen: isStepCount(TROVE_STEPS),
      tools: troveTools(),
    });
    challenge = challenged.text;
    charges.push({
      modelId: adversary.id,
      providerMetadata: challenged.providerMetadata,
      usage: challenged.usage,
    });
  } catch (error) {
    console.error(
      "adversary challenge error",
      error instanceof Error ? error.message : "unknown"
    );
  }

  const briefing = [
    draft ? `${answerName}'s draft, after searching the web:\n${draft}` : "",
    challenge
      ? `Trove's challenge, after searching the web and reading Oregon figures when a number was needed:\n${challenge}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    adversaryName: TROVE_NAME,
    answerName,
    briefing,
    charges,
    record: "",
  };
}

export function answerInstructions({
  answerName,
  briefing,
  record,
  requestPrompt,
  toolPrompt,
}: {
  answerName: string;
  briefing: string;
  record: string;
  requestPrompt: string;
  toolPrompt: string;
}) {
  return [
    `You are ${answerName}, answering an Oregon business owner the way a frontier model answers in Claude or Gemini: direct, and visual when they ask for a visual. Start the reply. Do not narrate your research. When a local number matters, call web_search and oregon_figures. Prefer the place they named over a statewide average. ${chartRule}`,
    requestPrompt,
    record,
    briefing,
    "Call web_search and oregon_figures whenever a current or local number is needed. Do not stop after one lookup. Charts stay in the reply. Document tools are only for when the person asks you to write a file.",
    toolPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");
}

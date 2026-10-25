"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import { toast } from "@/components/chat/toast";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { useAutoResume } from "@/hooks/use-auto-resume";
import {
  ADVERSARY_MODEL_ID,
  ANSWER_MODEL_ID,
  DEFAULT_CHAT_MODEL,
  pairModel,
} from "@/lib/ai/models";
import type { Vote } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";

type ActiveChatContextValue = {
  chatId: string;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  isLoading: boolean;
  votes: Vote[] | undefined;
  currentModelId: string;
  setCurrentModelId: (id: string) => void;
  answerModelId: string;
  adversaryModelId: string;
  setAnswerModelId: (id: string) => void;
  setAdversaryModelId: (id: string) => void;
  showCreditCardAlert: boolean;
  setShowCreditCardAlert: Dispatch<SetStateAction<boolean>>;
};

const ActiveChatContext = createContext<ActiveChatContextValue | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export function ActiveChatProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    setDataStream,
    setGatewaySuggestions,
    setSuggesting,
    setWaitingStatus,
    sourcePicksRef,
  } = useDataStream();
  const { mutate } = useSWRConfig();

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(generateUUID());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = generateUUID();
  }
  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const [currentModelId, setCurrentModelId] = useState(DEFAULT_CHAT_MODEL);
  const currentModelIdRef = useRef(currentModelId);
  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  const [answerModelId, setAnswerModelIdState] = useState(ANSWER_MODEL_ID);
  const [adversaryModelId, setAdversaryModelIdState] =
    useState(ADVERSARY_MODEL_ID);
  const answerModelIdRef = useRef(answerModelId);
  const adversaryModelIdRef = useRef(adversaryModelId);
  answerModelIdRef.current = answerModelId;
  adversaryModelIdRef.current = adversaryModelId;

  useEffect(() => {
    const storedAnswer = window.localStorage.getItem("pair-answer-model");
    const storedAdversary = window.localStorage.getItem("pair-adversary-model");
    if (storedAnswer) {
      setAnswerModelIdState(pairModel(storedAnswer, ANSWER_MODEL_ID).id);
    }
    if (storedAdversary) {
      setAdversaryModelIdState(
        pairModel(storedAdversary, ADVERSARY_MODEL_ID).id
      );
    }
  }, []);

  const setAnswerModelId = useCallback((id: string) => {
    const next = pairModel(id, ANSWER_MODEL_ID).id;
    const other = adversaryModelIdRef.current;
    if (next === other) {
      const previous = answerModelIdRef.current;
      setAdversaryModelIdState(previous);
      window.localStorage.setItem("pair-adversary-model", previous);
    }
    setAnswerModelIdState(next);
    window.localStorage.setItem("pair-answer-model", next);
  }, []);

  const setAdversaryModelId = useCallback((id: string) => {
    const next = pairModel(id, ADVERSARY_MODEL_ID).id;
    const other = answerModelIdRef.current;
    if (next === other) {
      const previous = adversaryModelIdRef.current;
      setAnswerModelIdState(previous);
      window.localStorage.setItem("pair-answer-model", previous);
    }
    setAdversaryModelIdState(next);
    window.localStorage.setItem("pair-adversary-model", next);
  }, []);

  const [input, setInput] = useState("");
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);

  const { data: chatData, isLoading } = useSWR(
    isNewChat
      ? null
      : `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chatId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const initialMessages: ChatMessage[] = isNewChat
    ? []
    : (chatData?.messages ?? []);
  const wantsIncognito = searchParams.get("incognito") === "1";
  const storedIncognito =
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(`incognito:${chatId}`) === "1";
  const defaultVisibility: VisibilityType =
    wantsIncognito || storedIncognito ? "incognito" : "public";
  const { data: pickedVisibility } = useSWR<VisibilityType>(
    `${chatId}-visibility`,
    null,
    { fallbackData: defaultVisibility }
  );
  const visibility: VisibilityType =
    wantsIncognito || storedIncognito || pickedVisibility === "incognito"
      ? "incognito"
      : isNewChat
        ? (pickedVisibility ?? "public")
        : chatData?.visibility === "private"
          ? "private"
          : (pickedVisibility ?? chatData?.visibility ?? "public");
  const visibilityRef = useRef(visibility);
  visibilityRef.current = visibility;

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    generateId: generateUUID,
    id: chatId,
    messages: initialMessages,
    onData: (dataPart) => {
      if (dataPart.type === "data-waiting-status") {
        if (dataPart.data.phase === "waiting") {
          setGatewaySuggestions([]);
          setSuggesting(true);
        }
        setWaitingStatus(dataPart.data);
        return;
      }
      if (dataPart.type === "data-gateway-suggestions") {
        setGatewaySuggestions(dataPart.data);
        setSuggesting(false);
        return;
      }
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onError: (error) => {
      if (error instanceof ChatbotError && error.surface === "billing") {
        window.location.assign("/subscribe");
        return;
      }
      if (error.message?.includes("AI Gateway requires a valid credit card")) {
        setShowCreditCardAlert(true);
      } else if (error instanceof ChatbotError) {
        toast({ description: error.message, type: "error" });
      } else {
        toast({
          description: error.message || "Oops, an error occurred!",
          type: "error",
        });
      }
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    sendAutomaticallyWhen: ({ messages: currentMessages }) => {
      const lastMessage = currentMessages.at(-1);
      return (
        lastMessage?.parts?.some(
          (part) =>
            "state" in part &&
            part.state === "approval-responded" &&
            "approval" in part &&
            (part.approval as { approved?: boolean })?.approved === true
        ) ?? false
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat`,
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        const isToolApprovalContinuation =
          lastMessage?.role !== "user" ||
          request.messages.some((msg) =>
            msg.parts?.some((part) => {
              const { state } = part as { state?: string };
              return (
                state === "approval-responded" || state === "output-denied"
              );
            })
          );

        return {
          body: {
            id: request.id,
            ...(isToolApprovalContinuation
              ? { messages: request.messages }
              : { message: lastMessage }),
            adversaryModelId: adversaryModelIdRef.current,
            answerModelId: answerModelIdRef.current,
            selectedChatModel: answerModelIdRef.current,
            selectedVisibilityType: visibilityRef.current,
            ...(sourcePicksRef.current.length > 0
              ? { sources: sourcePicksRef.current }
              : {}),
            ...request.body,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (status === "submitted" || status === "ready" || status === "error") {
      setWaitingStatus(undefined);
    }
  }, [status, setWaitingStatus]);

  const loadedChatIds = useRef(new Set<string>());

  if (isNewChat && !loadedChatIds.current.has(newChatIdRef.current)) {
    loadedChatIds.current.add(newChatIdRef.current);
  }

  useEffect(() => {
    if (loadedChatIds.current.has(chatId)) {
      return;
    }
    if (chatData?.messages) {
      loadedChatIds.current.add(chatId);
      setMessages(chatData.messages);
    }
  }, [chatId, chatData?.messages, setMessages]);

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      if (isNewChat) {
        setMessages([]);
      }
    }
  }, [chatId, isNewChat, setMessages]);

  useEffect(() => {
    if (chatData && !isNewChat) {
      const cookieModel = document.cookie
        .split("; ")
        .find((row) => row.startsWith("chat-model="))
        ?.split("=")[1];
      if (cookieModel) {
        setCurrentModelId(decodeURIComponent(cookieModel));
      }
    }
  }, [chatData, isNewChat]);

  const hasAppendedQueryRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query && !hasAppendedQueryRef.current) {
      hasAppendedQueryRef.current = true;
      window.history.replaceState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      sendMessage({
        parts: [{ text: query, type: "text" }],
        role: "user" as const,
      });
    }
  }, [sendMessage, chatId]);

  useAutoResume({
    autoResume: !isNewChat && !!chatData,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isReadonly = isNewChat ? false : (chatData?.isReadonly ?? false);

  const { data: votes } = useSWR<Vote[]>(
    !isReadonly && messages.length >= 2
      ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/vote?chatId=${chatId}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const value = useMemo<ActiveChatContextValue>(
    () => ({
      addToolApprovalResponse,
      adversaryModelId,
      answerModelId,
      chatId,
      currentModelId,
      input,
      isLoading: !isNewChat && isLoading,
      isReadonly,
      messages,
      regenerate,
      sendMessage,
      setAdversaryModelId,
      setAnswerModelId,
      setCurrentModelId,
      setInput,
      setMessages,
      setShowCreditCardAlert,
      showCreditCardAlert,
      status,
      stop,
      visibilityType: visibility,
      votes,
    }),
    [
      chatId,
      messages,
      setMessages,
      sendMessage,
      status,
      stop,
      regenerate,
      addToolApprovalResponse,
      input,
      visibility,
      isReadonly,
      isNewChat,
      isLoading,
      votes,
      adversaryModelId,
      answerModelId,
      currentModelId,
      setAdversaryModelId,
      setAnswerModelId,
      showCreditCardAlert,
    ]
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChat() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return context;
}

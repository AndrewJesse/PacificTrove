export const ANSWER_MODEL_ID = "anthropic/claude-opus-5.5";

export const ADVERSARY_MODEL_ID = "spacexai/grok-4.7";

export const FRONTIER_MODEL_ID = ADVERSARY_MODEL_ID;

export const AUTO_MODEL_ID = "auto";

/** Cheap model behind Auto. It spends the monthly allowance more slowly. */
export const AUTO_TARGET_ID = "openai/gpt-5-nano";

export const DEFAULT_CHAT_MODEL = FRONTIER_MODEL_ID;

export const titleModel = {
  description: "Frontier model for titles and gateway suggestions",
  gatewayOrder: ["xai"],
  id: FRONTIER_MODEL_ID,
  name: "Grok 4.7",
  provider: "xai",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  discount?: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  shortName?: string;
};

export const pairModels: ChatModel[] = [
  {
    description: "Picks a frontier model for this side.",
    id: AUTO_MODEL_ID,
    name: "Auto",
    provider: "auto",
    shortName: "Auto",
  },
  {
    description: "",
    gatewayOrder: ["anthropic"],
    id: ANSWER_MODEL_ID,
    name: "Claude Opus 5.5",
    provider: "anthropic",
    shortName: "Claude",
  },
  {
    description: "",
    gatewayOrder: ["openai"],
    id: "openai/gpt-5.6-sol",
    name: "GPT 5.6 Sol",
    provider: "openai",
    shortName: "GPT",
  },
  {
    description: "",
    gatewayOrder: ["google"],
    id: "google/gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    shortName: "Gemini",
  },
  {
    description: "",
    gatewayOrder: ["xai"],
    id: ADVERSARY_MODEL_ID,
    name: "Grok 4.7",
    provider: "xai",
    shortName: "Grok",
  },
];

export function pairModel(
  modelId: string | undefined,
  fallbackId = ANSWER_MODEL_ID
) {
  return (
    pairModels.find((model) => model.id === modelId) ??
    pairModels.find((model) => model.id === fallbackId) ??
    pairModels[0]
  );
}

export function resolvePairModel(
  modelId: string | undefined,
  seat: "answer" | "adversary"
) {
  const selected = pairModel(
    modelId,
    seat === "answer" ? ANSWER_MODEL_ID : ADVERSARY_MODEL_ID
  );
  if (selected.id !== AUTO_MODEL_ID) {
    return selected;
  }
  return pairModel(seat === "answer" ? ANSWER_MODEL_ID : ADVERSARY_MODEL_ID);
}

export const chatModels: ChatModel[] = [
  {
    description: "A cheaper model. It uses less of the monthly allowance.",
    discount: "Discount",
    id: AUTO_MODEL_ID,
    name: "Auto",
    provider: "openai",
  },
  {
    description: "A small, inexpensive model.",
    discount: "Discount",
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "deepseek",
  },
  {
    description: "A fast, inexpensive Gemini model.",
    discount: "Discount",
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
  },
  {
    description: "A smaller GPT model.",
    discount: "Discount",
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai",
  },
  {
    description: "A smaller Claude model.",
    discount: "Discount",
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
  },
  {
    description: "Frontier model. It uses the allowance fastest.",
    gatewayOrder: ["xai"],
    id: FRONTIER_MODEL_ID,
    name: "Grok 4.7",
    provider: "xai",
  },
];

export function resolveModelId(modelId: string) {
  if (modelId === AUTO_MODEL_ID) {
    return AUTO_TARGET_ID;
  }
  if (chatModels.some((model) => model.id === modelId)) {
    return modelId;
  }
  return FRONTIER_MODEL_ID;
}

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  const results = await Promise.all(
    chatModels.map(async (model) => {
      try {
        const lookupId = model.id === AUTO_MODEL_ID ? AUTO_TARGET_ID : model.id;
        const res = await fetch(
          `https://ai-gateway.vercel.sh/v1/models/${lookupId}/endpoints`,
          { next: { revalidate: 86_400 } }
        );
        if (!res.ok) {
          return [model.id, { reasoning: false, tools: false, vision: false }];
        }

        const json = await res.json();
        const endpoints = json.data?.endpoints ?? [];
        const params = new Set(
          endpoints.flatMap(
            (e: { supported_parameters?: string[] }) =>
              e.supported_parameters ?? []
          )
        );
        const inputModalities = new Set(
          json.data?.architecture?.input_modalities ?? []
        );

        return [
          model.id,
          {
            reasoning: params.has("reasoning"),
            tools: params.has("tools"),
            vision: inputModalities.has("image"),
          },
        ];
      } catch {
        return [model.id, { reasoning: false, tools: false, vision: false }];
      }
    })
  );

  return Object.fromEntries(results);
}

export const isDemo = process.env.IS_DEMO === "1";

type GatewayModel = {
  id: string;
  name: string;
  type?: string;
  tags?: string[];
};

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export async function getAllGatewayModels(): Promise<
  GatewayModelWithCapabilities[]
> {
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return (json.data ?? [])
      .filter((m: GatewayModel) => m.type === "language")
      .map((m: GatewayModel) => ({
        capabilities: {
          reasoning: m.tags?.includes("reasoning") ?? false,
          tools: m.tags?.includes("tool-use") ?? false,
          vision: m.tags?.includes("vision") ?? false,
        },
        description: "",
        id: m.id,
        name: m.name,
        provider: m.id.split("/")[0],
      }));
  } catch {
    return [];
  }
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

export type ModelAvailability = "healthy" | "impacted" | "unknown";

type GatewayEndpoint = {
  provider_name?: string;
  status?: number;
  uptime_last_15m?: number;
  uptime_last_1h?: number;
  latency_last_1h?: {
    p50?: number;
    p95?: number;
  };
};

const PROVIDER_IMPACTED_UPTIME_THRESHOLD = 99;
const PROVIDER_IMPACTED_P50_MS = 10_000;
const PROVIDER_IMPACTED_P95_MS = 30_000;

function isEndpointImpacted(endpoint: GatewayEndpoint) {
  return (
    (endpoint.status !== undefined && endpoint.status !== 0) ||
    (endpoint.uptime_last_15m !== undefined &&
      endpoint.uptime_last_15m < PROVIDER_IMPACTED_UPTIME_THRESHOLD) ||
    (endpoint.uptime_last_1h !== undefined &&
      endpoint.uptime_last_1h < PROVIDER_IMPACTED_UPTIME_THRESHOLD) ||
    (endpoint.latency_last_1h?.p50 !== undefined &&
      endpoint.latency_last_1h.p50 > PROVIDER_IMPACTED_P50_MS) ||
    (endpoint.latency_last_1h?.p95 !== undefined &&
      endpoint.latency_last_1h.p95 > PROVIDER_IMPACTED_P95_MS)
  );
}

export async function getModelAvailability(
  modelId: string
): Promise<ModelAvailability> {
  const model = chatModels.find((item) => item.id === modelId);

  try {
    const res = await fetch(
      `https://ai-gateway.vercel.sh/v1/models/${model?.id ?? modelId}/endpoints`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      return "unknown";
    }

    const json = await res.json();
    const endpoints = (json.data?.endpoints ?? []) as GatewayEndpoint[];

    if (endpoints.length === 0) {
      return "unknown";
    }

    return endpoints.some(isEndpointImpacted) ? "impacted" : "healthy";
  } catch {
    return "unknown";
  }
}

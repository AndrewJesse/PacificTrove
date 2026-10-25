import { AUTO_TARGET_ID } from "@/lib/ai/models";

/** USD per token, from the AI Gateway catalog. */
const PRICES: Record<
  string,
  { cacheRead?: number; input: number; output: number }
> = {
  "anthropic/claude-haiku-4.5": { input: 0.000_001, output: 0.000_005 },
  "deepseek/deepseek-v4-flash": { input: 0.000_000_13, output: 0.000_000_26 },
  "google/gemini-2.5-flash-lite": { input: 0.000_000_1, output: 0.000_000_4 },
  "openai/gpt-5-mini": { input: 0.000_000_25, output: 0.000_002 },
  "openai/gpt-5-nano": { input: 0.000_000_05, output: 0.000_000_4 },
  "spacexai/grok-4.7": {
    cacheRead: 0.000_000_5,
    input: 0.000_002,
    output: 0.000_006,
  },
};

type UsageLike = {
  inputTokenDetails?: { cacheReadTokens?: number };
  inputTokens?: number;
  outputTokens?: number;
};

export function costMicrodollars({
  modelId,
  providerMetadata,
  usage,
}: {
  modelId: string;
  providerMetadata?: unknown;
  usage?: UsageLike;
}) {
  const reported = gatewayCostUsd(providerMetadata);
  if (reported !== null) {
    return Math.max(0, Math.round(reported * 1_000_000));
  }

  const price = PRICES[modelId] ?? PRICES[AUTO_TARGET_ID];
  if (!price || !usage) {
    return 0;
  }
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  const cache = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const fresh = Math.max(0, input - cache);
  const usd =
    fresh * price.input +
    cache * (price.cacheRead ?? price.input) +
    output * price.output;
  return Math.max(0, Math.round(usd * 1_000_000));
}

function gatewayCostUsd(providerMetadata: unknown) {
  if (!providerMetadata || typeof providerMetadata !== "object") {
    return null;
  }
  const { gateway } = providerMetadata as {
    gateway?: Record<string, unknown>;
  };
  const raw = gateway?.cost ?? gateway?.marketCost;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) ? value : null;
}

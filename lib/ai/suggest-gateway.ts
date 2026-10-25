import { generateText } from "ai";
import {
  type GatewayPick,
  gatewaySuggestionPrompt,
  parseGatewayPicks,
} from "./gateway-suggestions";
import { getLanguageModel } from "./providers";

export async function suggestGatewaySources(question: string, modelId: string) {
  const trimmed = question.trim();
  if (trimmed.length < 2) {
    return {
      picks: [] as GatewayPick[],
      providerMetadata: undefined,
      usage: undefined,
    };
  }
  const result = await generateText({
    model: getLanguageModel(modelId),
    prompt: gatewaySuggestionPrompt(trimmed),
  });
  return {
    picks: parseGatewayPicks(result.text),
    providerMetadata: result.providerMetadata,
    usage: result.usage,
  };
}

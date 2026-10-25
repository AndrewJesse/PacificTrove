import { generateText } from "ai";
import {
  type GatewayPick,
  gatewaySuggestionPrompt,
  parseGatewayPicks,
} from "./gateway-suggestions";
import { getLanguageModel } from "./providers";

export async function suggestGatewaySources(
  question: string
): Promise<GatewayPick[]> {
  const trimmed = question.trim();
  if (trimmed.length < 2) {
    return [];
  }
  const { text } = await generateText({
    model: getLanguageModel("chat-model"),
    prompt: gatewaySuggestionPrompt(trimmed),
  });
  return parseGatewayPicks(text);
}

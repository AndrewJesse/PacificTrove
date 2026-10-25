import { catalogBrief, GATEWAY_SOURCES } from "./gateway-catalog";

export type GatewayPick = {
  id: string;
  title: string;
  reason: string;
};

const MAX_PICKS = 4;

export function gatewaySuggestionPrompt(question: string): string {
  return [
    "You choose Oregon public-record sources for a sidebar. You do not answer the question.",
    'Return JSON only: {"picks":[{"id":"source id","reason":"one short sentence"}]}',
    `Choose at most ${MAX_PICKS} ids from this list. Use an id only if it would change the answer. If none fit, return {"picks":[]}.`,
    "",
    catalogBrief(),
    "",
    `Question: ${question}`,
  ].join("\n");
}

export function parseGatewayPicks(text: string): GatewayPick[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  const { picks } = parsed as { picks?: unknown };
  if (!Array.isArray(picks)) {
    return [];
  }
  const chosen: GatewayPick[] = [];
  for (const item of picks) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const { id: rawId, reason: rawReason } = item as {
      id?: unknown;
      reason?: unknown;
    };
    const id = String(rawId ?? "").trim();
    const source = GATEWAY_SOURCES.find((row) => row.id === id);
    if (!source || chosen.some((row) => row.id === id)) {
      continue;
    }
    const reason = String(rawReason ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
    chosen.push({ id, reason, title: source.title });
    if (chosen.length === MAX_PICKS) {
      break;
    }
  }
  return chosen;
}

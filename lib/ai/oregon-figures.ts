import { tool } from "ai";
import { z } from "zod";
import { oregonFigures } from "./gateway-readings";

const DOMAINS = [
  "people",
  "prices",
  "weather",
  "place",
  "licenses",
  "events",
  "news",
  "roads",
  "power",
] as const;

const warehouseUrl = process.env.OREGON_DATA_URL ?? "https://52.41.96.156";

async function livePack(place: string | undefined, domains: string[]) {
  const key = process.env.OREGON_DATA_API_KEY;
  if (!key) {
    return null;
  }
  try {
    const response = await fetch(`${warehouseUrl}/v1/evidence`, {
      body: JSON.stringify({
        city: place ?? "",
        domains,
        region: place ?? "",
        scope: place ? "city" : "state",
      }),
      headers: {
        apikey: key,
        "content-type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.text();
    return payload.slice(0, 8000);
  } catch {
    return null;
  }
}

export function oregonFiguresTool() {
  return tool({
    description:
      "Read Oregon business figures. Call this when the person wants an actual number: unemployment, income, rent, home value, licenses, power, mortgage, roads, or headlines. Pass a county or city when one is named.",
    execute: async ({ domains, place }) => {
      const filed = oregonFigures(place);
      const live = await livePack(place, domains);
      if (!live) {
        return `Figures on file:\n${filed}`;
      }
      return `Live warehouse pack:\n${live}\n\nFigures on file:\n${filed}`;
    },
    inputSchema: z.object({
      domains: z
        .array(z.enum(DOMAINS))
        .min(1)
        .max(4)
        .describe(
          "people, prices, weather, place, licenses, events, news, roads, or power"
        ),
      place: z
        .string()
        .describe("Oregon county or city, when the question names one")
        .optional(),
    }),
  });
}

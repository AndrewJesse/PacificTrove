import assert from "node:assert/strict";
import test from "node:test";
import { costMicrodollars } from "./cost";

test("a gateway cost is used when the provider reports one", () => {
  assert.equal(
    costMicrodollars({
      modelId: "spacexai/grok-4.7",
      providerMetadata: { gateway: { cost: "0.0125" } },
      usage: { inputTokens: 10, outputTokens: 10 },
    }),
    12_500
  );
});

test("token prices are the fallback, and Auto's model is cheaper than Grok", () => {
  const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000 };
  const grok = costMicrodollars({ modelId: "spacexai/grok-4.7", usage });
  const auto = costMicrodollars({ modelId: "openai/gpt-5-nano", usage });
  assert.equal(grok, 8_000_000);
  assert.ok(auto < grok / 10);
});

import assert from "node:assert/strict";
import test from "node:test";
import { splitChartReply } from "./charts";

test("a chart fence becomes a chart and the prose stays", () => {
  const parts = splitChartReply(`Here is the wage.\n\n\`\`\`chart
{"type":"line","title":"Minimum wage","unit":"$ per hour","x":["2016","2026"],"series":[{"name":"Hourly","data":[9.75,16.8]}]}
\`\`\`\n\nThat is the floor.`);
  assert.equal(parts.length, 3);
  assert.equal(parts[1]?.type, "chart");
  assert.equal(parts[1]?.chart?.title, "Minimum wage");
  assert.match(parts[2]?.text ?? "", /floor/);
});

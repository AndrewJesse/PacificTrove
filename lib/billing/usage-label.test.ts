import assert from "node:assert/strict";
import test from "node:test";
import { unlimitedUsageLabel } from "./usage-label";

test("usage stays hidden until an unlimited plan passes ninety-five dollars", () => {
  assert.equal(
    unlimitedUsageLabel({
      plan: "forty",
      spendMicro: 96_000_000,
      status: "active",
    }),
    ""
  );
  assert.equal(
    unlimitedUsageLabel({
      plan: "unlimited",
      spendMicro: 94_000_000,
      status: "active",
    }),
    ""
  );
  assert.equal(
    unlimitedUsageLabel({
      plan: "unlimited",
      spendMicro: 96_000_000,
      status: "active",
    }),
    "This month $100.00"
  );
  assert.equal(
    unlimitedUsageLabel({
      plan: "unlimited",
      spendMicro: 140_500_000,
      status: "active",
    }),
    "This month $140.50"
  );
});

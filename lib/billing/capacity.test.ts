import assert from "node:assert/strict";
import test from "node:test";
import { modelReserveUsd } from "./plans";

test("model reserve follows the active plans", () => {
  assert.equal(modelReserveUsd([]), 0);
  assert.equal(modelReserveUsd(["forty", "hundred", "unlimited"]), 276);
});

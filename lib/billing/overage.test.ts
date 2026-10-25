import assert from "node:assert/strict";
import test from "node:test";
import { previousMonthWindow } from "./plans";

test("usage window is the month before renewal", () => {
  const { since, until } = previousMonthWindow(Date.UTC(2026, 10, 25) / 1000);
  assert.equal(until.toISOString(), "2026-11-25T00:00:00.000Z");
  assert.equal(since.toISOString(), "2026-10-25T00:00:00.000Z");
});

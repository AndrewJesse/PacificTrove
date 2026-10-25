import assert from "node:assert/strict";
import test from "node:test";
import { startOfPacificDay } from "./pacific-day";

test("Pacific midnight stays on the daylight-saving calendar day", () => {
  const noon = new Date("2026-10-25T19:00:00.000Z");
  assert.equal(
    startOfPacificDay(noon).toISOString(),
    "2026-10-25T07:00:00.000Z"
  );
});

test("Pacific midnight stays on the standard-time calendar day", () => {
  const noon = new Date("2026-01-15T20:00:00.000Z");
  assert.equal(
    startOfPacificDay(noon).toISOString(),
    "2026-01-15T08:00:00.000Z"
  );
});

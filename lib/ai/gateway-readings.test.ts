import assert from "node:assert/strict";
import test from "node:test";
import {
  figuresForQuestion,
  foldoverReadings,
  oregonFigures,
  oregonRecord,
} from "./gateway-readings";

test("a named county adds its stored lines and the note", () => {
  const text = foldoverReadings(
    [
      {
        id: "laus_counties",
        note: "Show Deschutes next to the statewide rate.",
      },
      { id: "olcc_counties" },
      { id: "not_a_source" },
    ],
    "How is Deschutes doing?"
  );
  assert.match(text, /Deschutes County: unemployment 4.5 percent/);
  assert.match(text, /Deschutes County: 978 liquor licenses/);
  assert.match(
    text,
    /How to use it: Show Deschutes next to the statewide rate/
  );
  assert.doesNotMatch(text, /Baker County/);
  assert.doesNotMatch(text, /not_a_source/);
});

test("statewide series stay available when no county is named", () => {
  const text = foldoverReadings(
    [{ id: "qualityinfo" }, { id: "eia" }],
    "Hello"
  );
  assert.match(text, /September 2026: 5.0 percent/);
  assert.match(text, /residential 15.92 cents/);
  assert.doesNotMatch(text, /County:/);
});

test("the Oregon record is available without a source picker", () => {
  const text = oregonRecord();
  assert.match(text, /Deschutes: unemployment 4.5 percent/);
  assert.match(text, /September 2026: 5.0 percent/);
  assert.match(text, /Baker: unemployment 5.0 percent/);
});

test("Oregon City uses the Clackamas line", () => {
  const text = figuresForQuestion("minimum wage employees in Oregon City");
  assert.match(text, /Clackamas: unemployment/);
  assert.doesNotMatch(text, /Baker: unemployment/);
});

test("a place asks only for that county plus the statewide lines", () => {
  const text = oregonFigures("Deschutes County");
  assert.match(text, /Deschutes: unemployment 4.5 percent/);
  assert.match(text, /September 2026: 5.0 percent/);
  assert.doesNotMatch(text, /Baker: unemployment/);
});

test("an empty selection adds nothing", () => {
  assert.equal(foldoverReadings([], "Deschutes"), "");
  assert.equal(foldoverReadings(undefined, "Deschutes"), "");
});

import assert from "node:assert/strict";
import test from "node:test";
import { parseGatewayPicks } from "./gateway-suggestions";

test("a suggestion keeps only known gateway ids", () => {
  const picks = parseGatewayPicks(`Sure.
{"picks":[
  {"id":"laus_counties","reason":"The county rate is not the statewide 5 percent."},
  {"id":"made_up","reason":"Ignore this."},
  {"id":"eia","reason":"Power cost sits next to rent."}
]}`);
  assert.deepEqual(
    picks.map((pick) => pick.id),
    ["laus_counties", "eia"]
  );
  assert.equal(picks[0]?.title, "County unemployment");
});

test("an empty or broken reply suggests nothing", () => {
  assert.deepEqual(parseGatewayPicks("no json here"), []);
  assert.deepEqual(parseGatewayPicks('{"picks":[]}'), []);
});

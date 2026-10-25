import assert from "node:assert/strict";
import test from "node:test";
import { accessDecision } from "./access";

test("the owner account is never capped", () => {
  assert.equal(
    accessDecision({
      email: "Andrew.Marchese@iCloud.com",
      messageCount: 500,
      plan: null,
      spendMicro: 0,
      status: null,
    }),
    "allow"
  );
});

test("the unlimited plan does not stop the month", () => {
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 1,
      plan: "unlimited",
      spendMicro: 250_000_000,
      status: "active",
    }),
    "allow"
  );
});

test("the Dominic account stops at twenty dollars of model cost", () => {
  assert.equal(
    accessDecision({
      email: "Dominic989@gmail.com",
      messageCount: 40,
      plan: null,
      spendMicro: 19_999_999,
      status: null,
    }),
    "allow"
  );
  assert.equal(
    accessDecision({
      email: "dominic989@gmail.com",
      messageCount: 1,
      plan: null,
      spendMicro: 20_000_000,
      status: null,
    }),
    "cap"
  );
});

test("three free questions are the last ones before a plan", () => {
  assert.equal(
    accessDecision({
      email: "guest-1",
      messageCount: 2,
      plan: null,
      spendMicro: 0,
      status: null,
    }),
    "allow"
  );
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 3,
      plan: null,
      spendMicro: 0,
      status: null,
    }),
    "paywall"
  );
});

test("a paid plan stops when model cost would erase the margin", () => {
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 100,
      plan: "forty",
      spendMicro: 35_999_999,
      status: "active",
    }),
    "allow"
  );
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 1,
      plan: "forty",
      spendMicro: 36_000_000,
      status: "active",
    }),
    "cap"
  );
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 1,
      plan: "hundred",
      spendMicro: 36_000_000,
      status: "trialing",
    }),
    "allow"
  );
  assert.equal(
    accessDecision({
      email: "ada@example.com",
      messageCount: 10,
      plan: "forty",
      spendMicro: 0,
      status: "past_due",
    }),
    "paywall"
  );
});

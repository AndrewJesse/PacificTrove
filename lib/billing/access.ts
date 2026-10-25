import {
  budgetMicro,
  FREE_QUESTIONS,
  hardcodedBudgetMicro,
  isOwnerEmail,
  type PaidPlan,
} from "./plans";

export type AccessDecision = "allow" | "paywall" | "cap";

const OPEN_STATUSES = new Set(["active", "trialing"]);

export function accessDecision({
  email,
  messageCount,
  plan,
  spendMicro,
  status,
}: {
  email: string | null | undefined;
  messageCount: number;
  plan: PaidPlan | null;
  spendMicro: number;
  status: string | null;
}): AccessDecision {
  if (isOwnerEmail(email)) {
    return "allow";
  }

  const fixedBudget = hardcodedBudgetMicro(email);
  if (fixedBudget !== null) {
    return spendMicro >= fixedBudget ? "cap" : "allow";
  }

  if (plan === "unlimited" && status && OPEN_STATUSES.has(status)) {
    return "allow";
  }

  if (plan && status && OPEN_STATUSES.has(status)) {
    return spendMicro >= budgetMicro(plan) ? "cap" : "allow";
  }

  return messageCount >= FREE_QUESTIONS ? "paywall" : "allow";
}

export function startOfUtcMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const OWNER_EMAIL = "andrew.marchese@icloud.com";

export const DOMINIC_EMAIL = "dominic989@gmail.com";

/** Hard monthly model budget for the Dominic account, in millionths of a dollar. */
export const DOMINIC_BUDGET_MICRO = 20_000_000;

export const FREE_QUESTIONS = 3;

export const PLAN_FORTY = "forty" as const;
export const PLAN_HUNDRED = "hundred" as const;
export const PLAN_UNLIMITED = "unlimited" as const;

export type PaidPlan =
  | typeof PLAN_FORTY
  | typeof PLAN_HUNDRED
  | typeof PLAN_UNLIMITED;

/** Share of the subscription kept when the month is maxed out. */
export const PROFIT_SHARE = 0.1;

/** Subscription price in millionths of a dollar. */
export const PLAN_PRICE_MICRO: Record<PaidPlan, number> = {
  forty: 40_000_000,
  hundred: 100_000_000,
  unlimited: 100_000_000,
};

export function budgetMicro(plan: PaidPlan) {
  if (plan === PLAN_UNLIMITED) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.round(PLAN_PRICE_MICRO[plan] * (1 - PROFIT_SHARE));
}

/** The month of usage that a renewal invoice should bill. */
export function previousMonthWindow(periodStartSeconds: number) {
  const until = new Date(periodStartSeconds * 1000);
  const since = new Date(until);
  since.setUTCMonth(since.getUTCMonth() - 1);
  return { since, until };
}

/** Dollars of model access to keep funded for the active plans. */
export function modelReserveUsd(plans: Array<string | null>) {
  let usd = 0;
  for (const plan of plans) {
    if (plan === PLAN_FORTY) {
      usd += 36;
    } else if (plan === PLAN_HUNDRED) {
      usd += 90;
    } else if (plan === PLAN_UNLIMITED) {
      usd += 150;
    }
  }
  return usd;
}

/** Model cost above the $100 floor, in millionths of a dollar. */
export function overageMicro(spendMicro: number) {
  return Math.max(0, spendMicro - PLAN_PRICE_MICRO.unlimited);
}

export const PLAN_PRICES: Record<
  PaidPlan,
  {
    amount: string;
    env:
      | "STRIPE_PRICE_FORTY"
      | "STRIPE_PRICE_HUNDRED"
      | "STRIPE_PRICE_UNLIMITED";
    title: string;
  }
> = {
  forty: {
    amount: "$40",
    env: "STRIPE_PRICE_FORTY",
    title: "For regular use",
  },
  hundred: {
    amount: "$100",
    env: "STRIPE_PRICE_HUNDRED",
    title: "For heavier use",
  },
  unlimited: {
    amount: "$100",
    env: "STRIPE_PRICE_UNLIMITED",
    title: "Unlimited",
  },
};

export function isOwnerEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}

export function hardcodedBudgetMicro(email: string | null | undefined) {
  if (email?.trim().toLowerCase() === DOMINIC_EMAIL) {
    return DOMINIC_BUDGET_MICRO;
  }
  return null;
}

export function priceIdForPlan(plan: PaidPlan) {
  return process.env[PLAN_PRICES[plan].env]?.trim() ?? "";
}

export function planForPriceId(
  priceId: string | null | undefined
): PaidPlan | null {
  if (!priceId) {
    return null;
  }
  if (priceId === priceIdForPlan(PLAN_FORTY)) {
    return PLAN_FORTY;
  }
  if (priceId === priceIdForPlan(PLAN_HUNDRED)) {
    return PLAN_HUNDRED;
  }
  if (priceId === priceIdForPlan(PLAN_UNLIMITED)) {
    return PLAN_UNLIMITED;
  }
  return null;
}

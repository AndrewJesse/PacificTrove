import type Stripe from "stripe";
import {
  getBillingAccountByCustomer,
  saveBillingAccount,
  suspendBillingByCustomer,
} from "@/lib/db/queries";
import { type PaidPlan, planForPriceId } from "./plans";
import { getStripe } from "./stripe";

function periodDate(subscription: Stripe.Subscription, edge: "start" | "end") {
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_end?: number;
    current_period_start?: number;
  };
  const legacy = subscription as Stripe.Subscription & {
    current_period_end?: number;
    current_period_start?: number;
  };
  const stamp =
    edge === "start"
      ? (item?.current_period_start ?? legacy.current_period_start)
      : (item?.current_period_end ?? legacy.current_period_end);
  return stamp ? new Date(stamp * 1000) : null;
}

export async function saveStripeSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price?.id;
  const plan: PaidPlan | null = planForPriceId(priceId);
  const { customer } = subscription;
  const stripeCustomerId =
    typeof customer === "string" ? customer : customer.id;

  await saveBillingAccount({
    currentPeriodEnd: periodDate(subscription, "end"),
    currentPeriodStart: periodDate(subscription, "start"),
    plan,
    status: subscription.status,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    userId,
  });
}

async function userIdForSubscription(subscription: Stripe.Subscription) {
  const fromMetadata = subscription.metadata?.userId?.trim();
  if (fromMetadata) {
    return fromMetadata;
  }
  const { customer } = subscription;
  const stripeCustomerId =
    typeof customer === "string" ? customer : customer.id;
  const existing = await getBillingAccountByCustomer(stripeCustomerId);
  return existing?.userId ?? null;
}

export async function syncSubscriptionId(
  subscriptionId: string,
  userId?: string
) {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const owner = userId ?? (await userIdForSubscription(subscription));
  if (!owner) {
    return;
  }
  await saveStripeSubscription(owner, subscription);
}

export async function syncSubscriptionEvent(subscription: Stripe.Subscription) {
  const owner = await userIdForSubscription(subscription);
  if (!owner) {
    return;
  }
  await saveStripeSubscription(owner, subscription);
}

export async function customerIdFromCharge(chargeId: string) {
  const charge = await getStripe().charges.retrieve(chargeId);
  const { customer } = charge;
  if (!customer) {
    return null;
  }
  return typeof customer === "string" ? customer : customer.id;
}

export async function suspendCustomer(stripeCustomerId: string) {
  await suspendBillingByCustomer(stripeCustomerId);
}

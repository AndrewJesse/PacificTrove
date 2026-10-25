import type Stripe from "stripe";
import {
  getBillingAccountByCustomer,
  getSpendMicroSince,
} from "@/lib/db/queries";
import {
  overageMicro,
  PLAN_UNLIMITED,
  planForPriceId,
  previousMonthWindow,
} from "./plans";
import { getStripe } from "./stripe";
import { collectsTax } from "./tax";

const USAGE_DESCRIPTION = "Model usage above the $100 monthly minimum";

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer) {
    return "";
  }
  return typeof customer === "string" ? customer : customer.id;
}

async function taxCodeForPrice(stripe: Stripe, priceId: string | undefined) {
  if (!priceId) {
    return;
  }
  const price = await stripe.prices.retrieve(priceId, {
    expand: ["product"],
  });
  const { product } = price;
  if (!product || typeof product === "string" || product.deleted) {
    return;
  }
  const code = product.tax_code;
  if (!code) {
    return;
  }
  return typeof code === "string" ? code : code.id;
}

export async function addUsageOverage(invoice: Stripe.Invoice) {
  if (
    invoice.billing_reason !== "subscription_cycle" ||
    invoice.status !== "draft"
  ) {
    return;
  }
  const details = invoice.parent?.subscription_details;
  const subscription = details?.subscription;
  const subscriptionId =
    typeof subscription === "string" ? subscription : subscription?.id;
  const customerId = customerIdOf(invoice.customer);
  if (!subscriptionId || !customerId) {
    return;
  }

  const stripe = getStripe();
  const current = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = current.items.data[0]?.price?.id;
  if (planForPriceId(priceId) !== PLAN_UNLIMITED) {
    return;
  }

  const account = await getBillingAccountByCustomer(customerId);
  if (!account) {
    return;
  }
  const { since, until } = previousMonthWindow(invoice.period_start);
  const spend = await getSpendMicroSince({
    since,
    until,
    userId: account.userId,
  });
  const cents = Math.round(overageMicro(spend) / 10_000);
  if (cents <= 0) {
    return;
  }

  const items = await stripe.invoiceItems.list({
    invoice: invoice.id,
    limit: 20,
  });
  if (items.data.some((item) => item.metadata?.kind === "usage_overage")) {
    return;
  }

  const taxCode = await taxCodeForPrice(stripe, priceId);
  await stripe.invoiceItems.create(
    {
      amount: cents,
      currency: "usd",
      customer: customerId,
      description: USAGE_DESCRIPTION,
      invoice: invoice.id,
      metadata: { kind: "usage_overage" },
      ...(taxCode ? { tax_code: taxCode } : {}),
    },
    { idempotencyKey: `usage-${invoice.id}` }
  );
}

export async function billClosingOverage(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id;
  if (planForPriceId(priceId) !== PLAN_UNLIMITED) {
    return;
  }
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) {
    return;
  }
  const account = await getBillingAccountByCustomer(customerId);
  if (!account) {
    return;
  }

  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_start?: number;
  };
  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
  };
  const stamp = item?.current_period_start ?? legacy.current_period_start;
  const since = stamp
    ? new Date(stamp * 1000)
    : (account.currentPeriodStart ??
      previousMonthWindow(Date.now() / 1000).since);
  const spend = await getSpendMicroSince({
    since,
    until: new Date(),
    userId: account.userId,
  });
  const cents = Math.round(overageMicro(spend) / 10_000);
  if (cents <= 0) {
    return;
  }

  const stripe = getStripe();
  const marker = `${subscription.id}-${Math.floor(since.getTime() / 1000)}`;
  const taxCode = await taxCodeForPrice(stripe, priceId);
  const taxOn = await collectsTax(stripe);
  await stripe.invoiceItems.create(
    {
      amount: cents,
      currency: "usd",
      customer: customerId,
      description: USAGE_DESCRIPTION,
      metadata: { close: marker, kind: "usage_overage" },
      ...(taxCode ? { tax_code: taxCode } : {}),
    },
    { idempotencyKey: `usage-close-item-${marker}` }
  );
  await stripe.invoices.create(
    {
      auto_advance: true,
      collection_method: "charge_automatically",
      customer: customerId,
      metadata: { close: marker, kind: "usage_overage" },
      pending_invoice_items_behavior: "include",
      ...(taxOn ? { automatic_tax: { enabled: true } } : {}),
    },
    { idempotencyKey: `usage-close-invoice-${marker}` }
  );
}

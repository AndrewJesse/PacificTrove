import { auth } from "@/app/(auth)/auth";
import {
  type PaidPlan,
  PLAN_FORTY,
  PLAN_HUNDRED,
  PLAN_UNLIMITED,
  priceIdForPlan,
} from "@/lib/billing/plans";
import {
  getStripe,
  integrationLabel,
  stripeSecret,
} from "@/lib/billing/stripe";
import { checkoutTaxParams } from "@/lib/billing/tax";
import { guestRegex } from "@/lib/constants";
import {
  getBillingAccount,
  getUserById,
  saveBillingAccount,
} from "@/lib/db/queries";

const PORTAL_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

export async function POST(request: Request) {
  const session = await auth();
  const account = session?.user?.id ? await getUserById(session.user.id) : null;

  if (!account || guestRegex.test(account.email)) {
    return Response.json(
      {
        code: "unauthorized:billing",
        message: "Sign in before choosing a plan.",
      },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    plan?: string;
  } | null;
  const plan = body?.plan;
  if (plan !== PLAN_FORTY && plan !== PLAN_HUNDRED && plan !== PLAN_UNLIMITED) {
    return Response.json({ message: "Choose a plan." }, { status: 400 });
  }

  const price = priceIdForPlan(plan as PaidPlan);
  if (!price || !stripeSecret()) {
    return Response.json(
      { message: "Subscriptions are not ready yet." },
      { status: 503 }
    );
  }

  try {
    const billing = await getBillingAccount(account.id);
    const { origin } = new URL(request.url);
    const stripe = getStripe();
    const portalConfiguration =
      process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
    const portalConfig = portalConfiguration
      ? { configuration: portalConfiguration }
      : {};

    if (
      billing?.stripeCustomerId &&
      billing.status &&
      PORTAL_STATUSES.has(billing.status)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: billing.stripeCustomerId,
        return_url: `${origin}/`,
        ...portalConfig,
      });
      return Response.json({ url: portal.url });
    }

    let customerId = billing?.stripeCustomerId ?? "";
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        metadata: { userId: account.id },
      });
      customerId = customer.id;
      await saveBillingAccount({
        currentPeriodEnd: billing?.currentPeriodEnd ?? null,
        currentPeriodStart: billing?.currentPeriodStart ?? null,
        plan: billing?.plan ?? null,
        status: "none",
        stripeCustomerId: customerId,
        stripeSubscriptionId: billing?.stripeSubscriptionId ?? null,
        userId: account.id,
      });
    }

    const tax = await checkoutTaxParams(stripe);
    const checkout = await stripe.checkout.sessions.create({
      cancel_url: `${origin}/subscribe`,
      client_reference_id: account.id,
      customer: customerId,
      integration_identifier: integrationLabel(),
      line_items: [{ price, quantity: 1 }],
      metadata: { plan, userId: account.id },
      mode: "subscription",
      subscription_data: { metadata: { userId: account.id } },
      success_url: `${origin}/subscribe?status=success`,
      ...tax,
    });

    if (!checkout.url) {
      return Response.json(
        { message: "The plan could not be opened." },
        { status: 502 }
      );
    }
    return Response.json({ url: checkout.url });
  } catch {
    return Response.json(
      { message: "The plan could not be opened." },
      { status: 502 }
    );
  }
}

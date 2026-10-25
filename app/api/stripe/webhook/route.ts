import type Stripe from "stripe";
import { addUsageOverage, billClosingOverage } from "@/lib/billing/overage";
import { getStripe, stripeSecret } from "@/lib/billing/stripe";
import {
  customerIdFromCharge,
  suspendCustomer,
  syncSubscriptionEvent,
  syncSubscriptionId,
} from "@/lib/billing/sync";
import { ownerAlert } from "@/lib/owner/alert";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature || !stripeSecret()) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    const paid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    if (paid && subscriptionId) {
      await syncSubscriptionId(
        subscriptionId,
        session.client_reference_id ?? session.metadata?.userId ?? undefined
      );
      const email =
        session.customer_details?.email ?? session.customer_email ?? undefined;
      await ownerAlert({
        email: email ?? undefined,
        kind: "subscribe",
        plan: session.metadata?.plan,
      });
    }
  } else if (event.type === "customer.subscription.updated") {
    await syncSubscriptionEvent(event.data.object);
  } else if (event.type === "customer.subscription.deleted") {
    await syncSubscriptionEvent(event.data.object);
    await billClosingOverage(event.data.object);
  } else if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  ) {
    const details = event.data.object.parent?.subscription_details;
    const subscription = details?.subscription;
    const subscriptionId =
      typeof subscription === "string" ? subscription : subscription?.id;
    if (subscriptionId) {
      await syncSubscriptionId(subscriptionId);
    }
  } else if (event.type === "charge.dispute.created") {
    const customerId = await customerIdFromCharge(
      event.data.object.charge as string
    );
    if (customerId) {
      await suspendCustomer(customerId);
    }
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object;
    if (charge.amount_refunded >= charge.amount && charge.customer) {
      const customerId =
        typeof charge.customer === "string"
          ? charge.customer
          : charge.customer.id;
      await suspendCustomer(customerId);
    }
  } else if (event.type === "invoice.created") {
    await addUsageOverage(event.data.object);
  } else if (event.type === "radar.early_fraud_warning.created") {
    const chargeId = event.data.object.charge;
    if (typeof chargeId === "string") {
      const customerId = await customerIdFromCharge(chargeId);
      if (customerId) {
        await suspendCustomer(customerId);
      }
    }
  }

  return Response.json({ ok: true });
}

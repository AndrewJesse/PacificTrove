import { auth } from "@/app/(auth)/auth";
import { getStripe, stripeSecret } from "@/lib/billing/stripe";
import { guestRegex } from "@/lib/constants";
import { getBillingAccount, getUserById } from "@/lib/db/queries";

export async function POST(request: Request) {
  const session = await auth();
  const account = session?.user?.id ? await getUserById(session.user.id) : null;

  if (!account || guestRegex.test(account.email)) {
    return Response.json(
      { message: "Sign in before managing a plan." },
      { status: 401 }
    );
  }

  const billing = await getBillingAccount(account.id);
  if (!billing?.stripeCustomerId || !stripeSecret()) {
    return Response.json(
      { message: "This account has no Stripe plan yet." },
      { status: 404 }
    );
  }

  const { origin } = new URL(request.url);
  const portalConfiguration =
    process.env.STRIPE_PORTAL_CONFIGURATION_ID?.trim();
  const portal = await getStripe().billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${origin}/`,
    ...(portalConfiguration ? { configuration: portalConfiguration } : {}),
  });

  return Response.json({ url: portal.url });
}

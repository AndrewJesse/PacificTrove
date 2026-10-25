import { auth } from "@/app/(auth)/auth";
import { startOfUtcMonth } from "@/lib/billing/access";
import { PLAN_PRICE_MICRO, PLAN_UNLIMITED } from "@/lib/billing/plans";
import { guestRegex } from "@/lib/constants";
import {
  getBillingAccount,
  getSpendMicroSince,
  getUserById,
} from "@/lib/db/queries";

export async function GET() {
  const session = await auth();
  const account = session?.user?.id ? await getUserById(session.user.id) : null;
  if (!account || guestRegex.test(account.email)) {
    return Response.json({ signedIn: false });
  }

  const billing = await getBillingAccount(account.id);
  const since = billing?.currentPeriodStart ?? startOfUtcMonth();
  const spendMicro = await getSpendMicroSince({
    since,
    userId: account.id,
  });

  return Response.json({
    minimumMicro:
      billing?.plan === PLAN_UNLIMITED ? PLAN_PRICE_MICRO.unlimited : null,
    plan: billing?.plan ?? null,
    signedIn: true,
    spendMicro,
    status: billing?.status ?? null,
  });
}

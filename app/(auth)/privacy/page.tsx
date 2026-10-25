import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight">Privacy</h1>
      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Pacific Trove stores the email and password hash for an account, the
          conversations you keep, and the model usage needed to bill a plan.
          Card numbers are handled by Stripe. We store Stripe’s customer id,
          subscription id, plan, and status.
        </p>
        <p>
          New conversations are public by default. You can switch a conversation
          to private. An incognito conversation is not written to the database.
          Usage on an incognito conversation is still recorded when it belongs
          to a signed-in account, because that usage is what the plan bills.
        </p>
        <p>
          We do not sell personal information. Stripe processes the payment and,
          where a tax registration is active, calculates tax from the billing
          address you enter at checkout.
        </p>
        <p>
          You can delete your saved chats from the sidebar. To close a plan, use
          Manage plan. Deleting chats does not cancel the subscription.
        </p>
        <p>
          <Link className="underline-offset-4 hover:underline" href="/terms">
            Terms
          </Link>
          {" · "}
          <Link
            className="underline-offset-4 hover:underline"
            href="/subscribe"
          >
            Plans
          </Link>
        </p>
      </div>
    </>
  );
}

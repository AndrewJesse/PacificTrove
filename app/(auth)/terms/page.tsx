import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight">Terms</h1>
      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Pacific Trove is a conversation product for people making business
          decisions, with a frontier model and an Oregon business check called
          Trove. These terms cover use of pacifictrove.com.
        </p>
        <p>
          Three questions are free on an account that has no plan. After that, a
          subscription is required. The $40 and $100 plans include a monthly
          allowance of model use. When that allowance is used, the conversation
          pauses until the next renewal. Unused allowance does not roll over.
        </p>
        <p>
          The Unlimited plan has a $100 monthly minimum and no pause. If model
          usage in the billing period stays under $100, the charge is $100. If
          usage is higher, the charge is that usage. Usage above the minimum is
          added to the next renewal invoice, and to a final invoice if the plan
          ends. The running total is shown in the profile menu.
        </p>
        <p>
          Plans renew monthly until you cancel. Cancel in the billing portal.
          Cancellation stops the next renewal. Access continues through the
          period already paid. Card payments are processed by Stripe. Pacific
          Trove does not store card numbers.
        </p>
        <p>
          Sales tax or VAT is added at checkout only where Pacific Trove is
          registered to collect it. A business tax ID can be entered at checkout
          when tax collection is on.
        </p>
        <p>
          New conversations are public unless you choose private or incognito.
          Incognito conversations are not saved. You are responsible for what
          you send, including anything you would not want public.
        </p>
        <p>
          Answers are assistance, not legal, tax, or financial advice. Check the
          numbers before you rely on them.
        </p>
        <p>
          <Link className="underline-offset-4 hover:underline" href="/privacy">
            Privacy
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

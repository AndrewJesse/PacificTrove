"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { guestRegex } from "@/lib/constants";

const plans = [
  {
    detail:
      "Included model use for the month. The conversation pauses when that runs out. Unused use does not roll over.",
    id: "forty",
    title: "$40 a month",
  },
  {
    detail:
      "A larger monthly allowance. It pauses when that runs out. Unused use does not roll over.",
    id: "hundred",
    title: "$100 a month",
  },
  {
    detail:
      "No pause and no monthly cap. You pay $100 if model usage is under $100, and the usage itself if it is more. The running total is in your profile menu.",
    id: "unlimited",
    title: "Unlimited · $100 minimum",
  },
] as const;

export default function SubscribePage() {
  const { data, status } = useSession();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const email = data?.user?.email ?? "";
  const signedIn = status === "authenticated" && !guestRegex.test(email);
  const [returned, setReturned] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReturned(
      new URLSearchParams(window.location.search).get("status") === "success"
    );
  }, []);

  useEffect(() => {
    if (!returned || !signedIn) {
      return;
    }
    let tries = 0;
    let cancelled = false;
    const look = async () => {
      tries += 1;
      try {
        const response = await fetch("/api/billing/usage");
        const body = (await response.json()) as { status?: string | null };
        if (cancelled) {
          return;
        }
        if (body.status === "active" || body.status === "trialing") {
          setReady(true);
          return;
        }
      } catch {
        /* keep trying */
      }
      if (!cancelled && tries < 8) {
        window.setTimeout(look, 1500);
      }
    };
    look().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [returned, signedIn]);

  const choose = useCallback(async (plan: string) => {
    setPending(plan);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        body: JSON.stringify({ plan }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const body = (await response.json()) as {
        message?: string;
        url?: string;
      };
      if (!response.ok || !body.url) {
        setError(body.message ?? "The plan could not be opened.");
        setPending(null);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError("The plan could not be opened.");
      setPending(null);
    }
  }, []);

  const manage = useCallback(async () => {
    setPending("portal");
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await response.json()) as {
        message?: string;
        url?: string;
      };
      if (!response.ok || !body.url) {
        setError(body.message ?? "Billing could not be opened.");
        setPending(null);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError("Billing could not be opened.");
      setPending(null);
    }
  }, []);

  return (
    <>
      <h1 className="font-serif text-3xl tracking-tight">Choose a plan</h1>
      <p className="text-sm text-muted-foreground">
        Three questions are free. After that, a plan keeps the conversation
        going. Cancel anytime in the billing portal. Sales tax or VAT is added
        at checkout where Pacific Trove is registered to collect it.
      </p>
      {returned ? (
        <p className="text-sm text-foreground">
          {ready
            ? "Your plan is active. You can go back to the conversation."
            : "Payment received. The plan is updating and will unlock in a few seconds."}
        </p>
      ) : null}
      {signedIn ? null : (
        <p className="text-sm text-muted-foreground">
          <Link
            className="underline-offset-4 hover:underline"
            href="/login?callbackUrl=/subscribe"
          >
            Sign in
          </Link>
          {" or "}
          <Link
            className="underline-offset-4 hover:underline"
            href="/register?callbackUrl=/subscribe"
          >
            create an account
          </Link>
          {" before paying."}
        </p>
      )}
      <div className="grid gap-3">
        {plans.map((plan) => (
          <PlanButton
            detail={plan.detail}
            disabled={!signedIn || pending !== null}
            key={plan.id}
            onChoose={choose}
            plan={plan.id}
            title={plan.title}
          />
        ))}
      </div>
      {signedIn ? (
        <ManageButton disabled={pending !== null} onManage={manage} />
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-[13px] text-muted-foreground">
        <Link className="underline-offset-4 hover:underline" href="/">
          Back to the conversation
        </Link>
        {" · "}
        <Link className="underline-offset-4 hover:underline" href="/terms">
          Terms
        </Link>
        {" · "}
        <Link className="underline-offset-4 hover:underline" href="/privacy">
          Privacy
        </Link>
      </p>
    </>
  );
}

function PlanButton({
  detail,
  disabled,
  onChoose,
  plan,
  title,
}: {
  detail: string;
  disabled: boolean;
  onChoose: (plan: string) => Promise<void>;
  plan: string;
  title: string;
}) {
  const choosePlan = useCallback(() => {
    onChoose(plan).catch(() => undefined);
  }, [onChoose, plan]);

  return (
    <button
      className="rounded-xl border border-border bg-card px-4 py-3 text-left disabled:opacity-50"
      disabled={disabled}
      onClick={choosePlan}
      type="button"
    >
      <span className="font-medium text-foreground">{title}</span>
      <span className="mt-1 block text-[13px] text-muted-foreground">
        {detail}
      </span>
    </button>
  );
}

function ManageButton({
  disabled,
  onManage,
}: {
  disabled: boolean;
  onManage: () => Promise<void>;
}) {
  const open = useCallback(() => {
    onManage().catch(() => undefined);
  }, [onManage]);

  return (
    <button
      className="text-left text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
      disabled={disabled}
      onClick={open}
      type="button"
    >
      Manage an existing plan
    </button>
  );
}

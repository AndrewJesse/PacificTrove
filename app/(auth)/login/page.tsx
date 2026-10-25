"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { callbackHref, nextPath } from "@/lib/auth-redirect";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [registerHref, setRegisterHref] = useState("/register");

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        description: "That email and password did not match.",
        type: "error",
      });
    } else if (state.status === "invalid_data") {
      toast({
        description:
          "Enter a valid email and a password of at least 6 characters.",
        type: "error",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.push(nextPath());
    }
  }, [state.status]);

  useEffect(() => {
    setRegisterHref(callbackHref("/register"));
  }, []);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to keep the conversation and your plan.
      </p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"No account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href={registerHref}
          >
            Sign up
          </Link>
        </p>
      </AuthForm>
    </>
  );
}

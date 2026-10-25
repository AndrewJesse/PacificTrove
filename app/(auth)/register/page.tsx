"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/chat/auth-form";
import { SubmitButton } from "@/components/chat/submit-button";
import { toast } from "@/components/chat/toast";
import { callbackHref, nextPath } from "@/lib/auth-redirect";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    { status: "idle" }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({
        description:
          "An account with that email already exists. Sign in instead.",
        type: "error",
      });
    } else if (state.status === "failed") {
      toast({
        description: "The account could not be created.",
        type: "error",
      });
    } else if (state.status === "invalid_data") {
      toast({
        description:
          "Enter a valid email and a password of at least 6 characters.",
        type: "error",
      });
    } else if (state.status === "success") {
      toast({ description: "Account created.", type: "success" });
      setIsSuccessful(true);
      updateSession();
      router.push(nextPath());
    }
  }, [state.status]);

  useEffect(() => {
    setLoginHref(callbackHref("/login"));
  }, []);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
      <p className="text-sm text-muted-foreground">
        Three questions are free. A plan starts after that.
      </p>
      <AuthForm action={handleSubmit} defaultEmail={email}>
        <SubmitButton isSuccessful={isSuccessful}>Sign up</SubmitButton>
        <p className="text-center text-[13px] text-muted-foreground">
          {"Have an account? "}
          <Link
            className="text-foreground underline-offset-4 hover:underline"
            href={loginHref}
          >
            Sign in
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
      </AuthForm>
    </>
  );
}

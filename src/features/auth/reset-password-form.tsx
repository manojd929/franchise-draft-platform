"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/app";
import {
  SIGN_IN_NOT_CONFIGURED,
  networkOrUnknownSignInUserMessage,
} from "@/lib/errors/safe-user-feedback";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MIN_PASSWORD_LENGTH = 8;

type FormStatus = "checking-session" | "ready" | "no-session" | "submitting" | "done" | "error";

export function ResetPasswordForm() {
  const router = useRouter();
  /**
   * Compute the misconfigured-Supabase branch synchronously so the initial
   * render is authoritative — this keeps the effect free of sync setState,
   * which trips `react-hooks/set-state-in-effect`.
   */
  const supabaseConfigured = isSupabaseConfigured();
  const [status, setStatus] = useState<FormStatus>(
    supabaseConfigured ? "checking-session" : "error",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    supabaseConfigured ? null : SIGN_IN_NOT_CONFIGURED,
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = createBrowserSupabaseClient();
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(networkOrUnknownSignInUserMessage(error));
        return;
      }
      setStatus(data.session ? "ready" : "no-session");
    });
  }, [supabaseConfigured]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    setStatus("submitting");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setStatus("ready");
        setErrorMessage(error.message);
        return;
      }
      setStatus("done");
      router.replace(ROUTES.dashboard);
      router.refresh();
    } catch (err) {
      setStatus("ready");
      setErrorMessage(networkOrUnknownSignInUserMessage(err));
    }
  }

  if (status === "checking-session") {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/95 px-6 py-6 text-sm text-muted-foreground">
        Checking your link…
      </div>
    );
  }

  if (status === "no-session") {
    return (
      <div className="flex w-full flex-col gap-4 rounded-2xl border border-border/70 bg-card/95 px-6 py-6 text-card-foreground shadow-lg sm:px-7 sm:py-7">
        <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Reset links are single-use and expire quickly.{" "}
          <a className="font-medium text-foreground underline" href={ROUTES.forgotPassword}>
            Request a fresh link
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-border/70 bg-card/95 px-6 py-6 text-card-foreground shadow-lg sm:px-7 sm:py-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Set a new password</h1>
        <p className="text-sm text-foreground/72 sm:text-base">
          At least {MIN_PASSWORD_LENGTH} characters. We&rsquo;ll sign you in once it&rsquo;s saved.
        </p>
      </div>

      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        {errorMessage ? (
          <p className="text-sm leading-snug text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button
          type="submit"
          pending={status === "submitting" || status === "done"}
          pendingLabel={status === "done" ? "Signing you in…" : "Saving…"}
          className="min-h-12 w-full text-base"
        >
          Save new password
        </Button>
      </form>
    </div>
  );
}

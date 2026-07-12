"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SIGN_IN_NOT_CONFIGURED,
  networkOrUnknownSignInUserMessage,
} from "@/lib/errors/safe-user-feedback";
import { ROUTES } from "@/constants/app";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type FormStatus = "idle" | "submitting" | "sent" | "error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    if (!isSupabaseConfigured()) {
      setStatus("error");
      setErrorMessage(SIGN_IN_NOT_CONFIGURED);
      return;
    }

    setStatus("submitting");
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo =
        typeof window === "undefined"
          ? undefined
          : `${window.location.origin}${ROUTES.resetPassword}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        setStatus("error");
        setErrorMessage("We couldn't send the reset email. Check the address and try again.");
        return;
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(networkOrUnknownSignInUserMessage(err));
    }
  }

  if (status === "sent") {
    return (
      <div className="flex w-full flex-col gap-4 rounded-2xl border border-border/70 bg-card/95 px-6 py-6 text-card-foreground shadow-lg backdrop-blur-xl sm:px-7 sm:py-7 dark:border-white/12 dark:bg-neutral-900/95">
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          If an account exists for <span className="font-medium text-foreground">{email}</span>,
          we&rsquo;ve sent a reset link. Follow it to set a new password.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn&rsquo;t get anything? Check spam, then try again in a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-border/70 bg-card/95 px-6 py-6 text-card-foreground shadow-lg backdrop-blur-xl sm:px-7 sm:py-7 dark:border-white/12 dark:bg-neutral-900/95">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">Reset your password</h1>
        <p className="text-sm leading-relaxed text-foreground/72 sm:text-base dark:text-foreground/80">
          Enter the email your organizer or team owner login uses. We&rsquo;ll email you a link to
          set a new password.
        </p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => void handleSubmit(event)}
        data-testid="forgot-password-form"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {errorMessage ? (
          <p className="text-sm leading-snug text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <Button
          type="submit"
          pending={status === "submitting"}
          pendingLabel="Sending…"
          className="min-h-12 w-full text-base"
        >
          Email me a reset link
        </Button>
      </form>
    </div>
  );
}

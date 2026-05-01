"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLeagueOwnerAction } from "@/features/tournaments/actions";

interface InviteOwnerPanelProps {
  tournamentSlug: string;
  invitingSupported: boolean;
}

export function InviteOwnerPanel({
  tournamentSlug,
  invitingSupported,
}: InviteOwnerPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setDoneMessage(null);
    setIsSubmitting(true);
    try {
      const result = await createLeagueOwnerAction({
        tournamentSlug,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        displayName: String(formData.get("displayName") ?? "").trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setDoneMessage(
        `Created login for ${result.email ?? "that account"}. Assign them with “Franchise owner” below.`,
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!invitingSupported) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm">
        <p className="font-medium text-foreground">Owner invites need one env variable</p>
        <p className="mt-2 text-muted-foreground">
          Add <span className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span> to{" "}
          <span className="font-mono text-xs">.env</span> (Supabase → Project Settings → API →{" "}
          <span className="font-mono text-xs">service_role</span>). Restart{" "}
          <span className="font-mono text-xs">npm run dev</span>. Until then, owners must still be
          created in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-6 backdrop-blur-md">
      <h3 className="text-lg font-semibold tracking-tight">Create franchise owner login</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Makes an email + password they use on the normal login page. The address only has to look
        like an email (it does not need a real inbox). Then assign them to a franchise below — no
        Supabase dashboard steps.
      </p>
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            placeholder="owner@example.com"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="invite-password">Temporary password</Label>
          <Input
            id="invite-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Min 8 characters"
          />
        </div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="invite-name">Display name (optional)</Label>
          <Input id="invite-name" name="displayName" placeholder="Priya K." />
        </div>
        <div className="flex sm:col-span-2 lg:col-span-1">
          <Button type="submit" disabled={isSubmitting} className="w-full lg:w-auto">
            {isSubmitting ? "Creating…" : "Create owner"}
          </Button>
        </div>
      </form>
      {doneMessage ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          {doneMessage}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

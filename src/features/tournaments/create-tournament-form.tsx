"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/constants/app";
import { DEFAULT_PICKS_PER_TEAM } from "@/constants/tournament-defaults";
import { createTournamentAction } from "@/features/tournaments/actions";
import { cn } from "@/lib/utils";

export function CreateTournamentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mx-auto flex max-w-xl flex-col gap-6"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const picksPerTeamRaw = String(formData.get("picksPerTeam") ?? "").trim();
          const result = await createTournamentAction({
            name: String(formData.get("name") ?? ""),
            description:
              String(formData.get("description") ?? "").trim() || undefined,
            ...(picksPerTeamRaw !== ""
              ? { picksPerTeam: Number(picksPerTeamRaw) }
              : {}),
            logoUrl: String(formData.get("logoUrl") ?? "").trim(),
            colorHex: String(formData.get("colorHex") ?? "").trim(),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          if (result.slug) {
            router.push(ROUTES.teams(result.slug));
            router.refresh();
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Tournament name</Label>
        <Input id="name" name="name" required minLength={2} placeholder="Manhattan Badminton Winter Cup" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Notes (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Anything your helpers should remember"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tournament-logo-url">Tournament logo (optional)</Label>
        <Input
          id="tournament-logo-url"
          name="logoUrl"
          type="url"
          inputMode="url"
          placeholder="https://… link to your logo image"
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tournament-theme-color">Theme color</Label>
        <input
          id="tournament-theme-color"
          name="colorHex"
          type="color"
          defaultValue="#38bdf8"
          className="h-11 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="picksPerTeam">
          Picks each team makes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="picksPerTeam"
          name="picksPerTeam"
          type="number"
          min={1}
          max={50}
          placeholder={`Default ${DEFAULT_PICKS_PER_TEAM}`}
          aria-describedby="picksPerTeam-hint"
        />
        <p id="picksPerTeam-hint" className="text-xs text-muted-foreground">
          Leave blank to use {DEFAULT_PICKS_PER_TEAM} snake-draft picks per team. Enter a number between 1 and 50 only if you want a different draft length.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Saving…" : "Create tournament"}
        </Button>
        <Link
          href={ROUTES.dashboard}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

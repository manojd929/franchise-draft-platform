"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveSquadRulesAction } from "@/features/tournaments/actions";
import type { SquadRuleDto } from "@/types/draft";
import { PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";
import type { PickLimitsCategoryFitRow } from "@/features/tournaments/pick-limits-guidance";
import type { PlayerCategory } from "@/generated/prisma/enums";
import { sortBySquadRuleCategoryOrder } from "@/lib/squad-rules/compute-per-team-caps";

interface SquadRulesFormProps {
  tournamentSlug: string;
  initialRules: SquadRuleDto[];
  rosterSummary: {
    teamCount: number;
    playersPerCategory: Partial<Record<PlayerCategory, number>>;
    categoryFitRows: PickLimitsCategoryFitRow[];
  };
}

export function SquadRulesForm({
  tournamentSlug,
  initialRules,
  rosterSummary,
}: SquadRulesFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ordered = sortBySquadRuleCategoryOrder(initialRules);

  const { teamCount, playersPerCategory, categoryFitRows } = rosterSummary;

  const fitByCategory = new Map(
    categoryFitRows.map((row) => [row.category, row]),
  );

  return (
    <form
      className="space-y-6 rounded-xl border border-border/70 bg-card/40 p-6 backdrop-blur-md"
      action={(formData) => {
        startTransition(async () => {
          setError(null);
          const rules = ordered.map((rule) => ({
            category: rule.category,
            maxCount: Number(formData.get(rule.category) ?? rule.maxCount),
          }));
          const result = await saveSquadRulesAction({
            tournamentSlug,
            rules,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {ordered.map((rule) => {
          const pool = playersPerCategory[rule.category] ?? 0;
          const fairFloor =
            teamCount > 0 ? Math.floor(pool / teamCount) : 0;
          const fit = fitByCategory.get(rule.category);
          const remainder = fit?.remainderAfterEvenSplit ?? 0;
          const allocated =
            teamCount > 0 && fit ? teamCount * fit.fairCapPerTeam : 0;
          const addForEven =
            teamCount > 0 && pool > 0
              ? Math.ceil(pool / teamCount) * teamCount - pool
              : 0;

          return (
            <div key={rule.category} className="space-y-2">
              <Label htmlFor={rule.category}>{PLAYER_CATEGORY_LABEL[rule.category]}</Label>
              <Input
                id={rule.category}
                name={rule.category}
                type="number"
                min={0}
                max={50}
                defaultValue={rule.maxCount}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {teamCount <= 0 ? (
                  <>Add teams first. Fair-share caps use roster count ÷ teams.</>
                ) : (
                  <>
                    <span className="text-foreground/90">{pool}</span>{" "}
                    {pool === 1 ? "player" : "players"} in this group ·{" "}
                    <span className="text-foreground/90">{teamCount}</span>{" "}
                    {teamCount === 1 ? "team" : "teams"}
                    {" · "}
                    Auto-set uses ⌊pool ÷ teams⌋ ={" "}
                    <span className="font-medium text-foreground/90">{fairFloor}</span> for this
                    group (your saved cap above can differ).
                  </>
                )}
              </p>
              {teamCount > 0 && remainder > 0 ? (
                <p
                  role="status"
                  className="rounded-md border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-foreground dark:bg-amber-950/35"
                >
                  <strong className="font-semibold">Uneven split:</strong> identical caps only
                  cover <strong>{allocated}</strong> of <strong>{pool}</strong> players (
                  {teamCount}×{fairFloor}).{" "}
                  <strong>
                    {remainder} player{remainder === 1 ? "" : "s"}
                  </strong>{" "}
                  still exceed that symmetric split:{" "}
                  <strong>recategorize {remainder}</strong>,{" "}
                  <strong>
                    add {addForEven} more here
                  </strong>{" "}
                  so the pool divides evenly by {teamCount}, or raise this cap manually.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {error ? (
        <p
          className="whitespace-pre-wrap text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving composition law…" : "Save squad caps"}
      </Button>
    </form>
  );
}

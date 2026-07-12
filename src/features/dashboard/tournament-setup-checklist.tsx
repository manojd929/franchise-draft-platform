import Link from "next/link";

import type { TournamentSetupChecklist } from "@/lib/tournaments/tournament-setup-checklist";
import { cn } from "@/lib/utils";

interface TournamentSetupChecklistPanelProps {
  checklist: TournamentSetupChecklist;
}

/**
 * Compact status row for a tournament card: one pill per setup step, with a
 * green dot when done, a hollow dot when pending, and a follow-through link
 * to whichever step is next.
 */
export function TournamentSetupChecklistPanel({ checklist }: TournamentSetupChecklistPanelProps) {
  const { steps, completedCount, totalCount, nextIncompleteHref, isReadyToDraft } = checklist;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-3 text-xs">
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="font-semibold tracking-wide text-muted-foreground uppercase">
          Setup {completedCount}/{totalCount}
        </span>
        {isReadyToDraft ? (
          <span className="rounded-full border border-brand/40 bg-brand-soft/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-accent uppercase">
            Ready
          </span>
        ) : nextIncompleteHref ? (
          <Link
            href={nextIncompleteHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Continue setup →
          </Link>
        ) : null}
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              aria-label={`${step.label}: ${step.hint}`}
              title={step.hint}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                step.done
                  ? "border-brand/40 bg-brand-soft/40 text-foreground hover:border-brand/60"
                  : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 rounded-full",
                  step.done ? "bg-brand" : "border border-border/80 bg-transparent",
                )}
              />
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

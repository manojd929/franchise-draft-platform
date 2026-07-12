import { ROUTES } from "@/constants/app";
import type { DraftPhase } from "@/generated/prisma/enums";

/**
 * Snapshot of tournament setup counts used to compute the dashboard-card
 * checklist. Kept as a plain shape so the helper stays pure and testable
 * without a Prisma import.
 */
export interface TournamentSetupCounts {
  activeRosterCategories: number;
  activeTeams: number;
  activePlayers: number;
  teamsWithOwner: number;
  configuredSquadRules: number;
  draftPhase: DraftPhase;
}

export type TournamentSetupStepKey = "rosterGroups" | "teams" | "players" | "owners" | "squadRules";

export interface TournamentSetupStep {
  key: TournamentSetupStepKey;
  label: string;
  done: boolean;
  href: string;
  /** Short remaining-work hint for the tooltip / aria-label. */
  hint: string;
}

export interface TournamentSetupChecklist {
  steps: TournamentSetupStep[];
  completedCount: number;
  totalCount: number;
  nextIncompleteHref: string | null;
  isReadyToDraft: boolean;
}

interface ComputeSetupChecklistOptions {
  tournamentSlug: string;
  counts: TournamentSetupCounts;
}

const TERMINAL_DRAFT_PHASES: ReadonlySet<DraftPhase> = new Set<DraftPhase>([
  "LIVE",
  "PAUSED",
  "FROZEN",
  "LOCKED",
  "COMPLETED",
]);

export function computeTournamentSetupChecklist({
  tournamentSlug,
  counts,
}: ComputeSetupChecklistOptions): TournamentSetupChecklist {
  const rosterGroupsDone = counts.activeRosterCategories > 0;
  const teamsDone = counts.activeTeams > 0;
  const playersDone = counts.activePlayers > 0;
  const ownersDone = counts.activeTeams > 0 && counts.teamsWithOwner >= counts.activeTeams;
  const squadRulesDone = counts.configuredSquadRules > 0;

  const steps: TournamentSetupStep[] = [
    {
      key: "rosterGroups",
      label: "Roster groups",
      done: rosterGroupsDone,
      href: ROUTES.categories(tournamentSlug),
      hint: rosterGroupsDone
        ? `${counts.activeRosterCategories} configured`
        : "Add at least one roster group.",
    },
    {
      key: "teams",
      label: "Teams",
      done: teamsDone,
      href: ROUTES.teams(tournamentSlug),
      hint: teamsDone ? `${counts.activeTeams} teams` : "Create teams before the draft.",
    },
    {
      key: "players",
      label: "Players",
      done: playersDone,
      href: ROUTES.players(tournamentSlug),
      hint: playersDone ? `${counts.activePlayers} players` : "Add or bulk-import players.",
    },
    {
      key: "owners",
      label: "Owners",
      done: ownersDone,
      href: ROUTES.teams(tournamentSlug),
      hint: (() => {
        if (counts.activeTeams === 0) return "Create teams first.";
        if (ownersDone) return "Every team has an owner.";
        const remaining = counts.activeTeams - counts.teamsWithOwner;
        return `${remaining} team${remaining === 1 ? "" : "s"} still need an owner.`;
      })(),
    },
    {
      key: "squadRules",
      label: "Rules",
      done: squadRulesDone,
      href: ROUTES.rules(tournamentSlug),
      hint: squadRulesDone ? "Squad rules set" : "Set a cap per roster group.",
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const firstIncomplete = steps.find((step) => !step.done);

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    nextIncompleteHref: firstIncomplete?.href ?? null,
    isReadyToDraft: completedCount === steps.length || TERMINAL_DRAFT_PHASES.has(counts.draftPhase),
  };
}

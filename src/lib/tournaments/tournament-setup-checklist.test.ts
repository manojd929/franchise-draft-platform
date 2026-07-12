import { describe, expect, it } from "vitest";

import { DraftPhase } from "@/generated/prisma/enums";

import {
  computeTournamentSetupChecklist,
  type TournamentSetupCounts,
} from "./tournament-setup-checklist";

const SLUG = "summer-cup";

const emptyCounts: TournamentSetupCounts = {
  activeRosterCategories: 0,
  activeTeams: 0,
  activePlayers: 0,
  teamsWithOwner: 0,
  configuredSquadRules: 0,
  draftPhase: DraftPhase.SETUP,
};

const completeCounts: TournamentSetupCounts = {
  activeRosterCategories: 3,
  activeTeams: 4,
  activePlayers: 40,
  teamsWithOwner: 4,
  configuredSquadRules: 3,
  draftPhase: DraftPhase.SETUP,
};

describe("computeTournamentSetupChecklist", () => {
  it("marks every step incomplete for a fresh tournament", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: emptyCounts,
    });

    expect(result.completedCount).toBe(0);
    expect(result.totalCount).toBe(5);
    expect(result.steps.every((step) => step.done === false)).toBe(true);
    expect(result.nextIncompleteHref).toBe(`/tournament/${SLUG}/categories`);
    expect(result.isReadyToDraft).toBe(false);
  });

  it("marks every step complete when counts are healthy", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: completeCounts,
    });

    expect(result.completedCount).toBe(5);
    expect(result.steps.every((step) => step.done === true)).toBe(true);
    expect(result.nextIncompleteHref).toBeNull();
    expect(result.isReadyToDraft).toBe(true);
  });

  it("keeps owners step incomplete when at least one team lacks an owner", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: { ...completeCounts, teamsWithOwner: 3 },
    });

    const ownersStep = result.steps.find((step) => step.key === "owners");
    expect(ownersStep?.done).toBe(false);
    expect(ownersStep?.hint).toContain("1 team");
    expect(result.completedCount).toBe(4);
    expect(result.nextIncompleteHref).toBe(`/tournament/${SLUG}/teams`);
  });

  it("keeps owners step incomplete when there are no teams", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: { ...completeCounts, activeTeams: 0, teamsWithOwner: 0 },
    });

    const ownersStep = result.steps.find((step) => step.key === "owners");
    expect(ownersStep?.done).toBe(false);
    expect(ownersStep?.hint).toContain("Create teams first");
  });

  it("routes nextIncompleteHref to the first incomplete step in canonical order", () => {
    const withRosterOnly: TournamentSetupCounts = {
      ...emptyCounts,
      activeRosterCategories: 2,
    };
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: withRosterOnly,
    });
    expect(result.nextIncompleteHref).toBe(`/tournament/${SLUG}/teams`);
  });

  it("treats terminal draft phases as ready even if counts are stale", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: { ...emptyCounts, draftPhase: DraftPhase.LIVE },
    });
    expect(result.isReadyToDraft).toBe(true);
  });

  it("does not treat SETUP with zero-progress as ready", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: { ...emptyCounts, draftPhase: DraftPhase.SETUP },
    });
    expect(result.isReadyToDraft).toBe(false);
  });

  it("does not treat READY phase alone as ready-to-draft (still checks steps)", () => {
    const result = computeTournamentSetupChecklist({
      tournamentSlug: SLUG,
      counts: { ...emptyCounts, draftPhase: DraftPhase.READY },
    });
    expect(result.isReadyToDraft).toBe(false);
  });
});

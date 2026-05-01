import { describe, expect, it } from "vitest";

import { PlayerCategory } from "@/generated/prisma/enums";

import {
  computePerTeamCategoryCaps,
  SQUAD_RULE_CATEGORY_ORDER,
  sortBySquadRuleCategoryOrder,
} from "./compute-per-team-caps";
import { validateSquadRulesAgainstRoster } from "./validate-squad-rules-against-roster";

describe("sortBySquadRuleCategoryOrder", () => {
  it("orders beginner → intermediate → advanced → women", () => {
    const mixed = [
      { category: PlayerCategory.MEN_ADVANCED, maxCount: 5 },
      { category: PlayerCategory.WOMEN, maxCount: 2 },
      { category: PlayerCategory.MEN_BEGINNER, maxCount: 10 },
      { category: PlayerCategory.MEN_INTERMEDIATE, maxCount: 2 },
    ];
    const sorted = sortBySquadRuleCategoryOrder(mixed);
    expect(sorted.map((r) => r.category)).toEqual([
      PlayerCategory.MEN_BEGINNER,
      PlayerCategory.MEN_INTERMEDIATE,
      PlayerCategory.MEN_ADVANCED,
      PlayerCategory.WOMEN,
    ]);
  });
});

describe("computePerTeamCategoryCaps", () => {
  it("uses fair floor(pool / teams) per category", () => {
    const caps = computePerTeamCategoryCaps({
      teamCount: 4,
      playersPerCategory: { [PlayerCategory.MEN_INTERMEDIATE]: 50 },
    });
    expect(caps[PlayerCategory.MEN_INTERMEDIATE]).toBe(12);
    expect(caps[PlayerCategory.MEN_BEGINNER]).toBe(0);
  });

  it("returns zeros when there are no teams", () => {
    const caps = computePerTeamCategoryCaps({
      teamCount: 0,
      playersPerCategory: { [PlayerCategory.MEN_INTERMEDIATE]: 99 },
    });
    expect(caps[PlayerCategory.MEN_INTERMEDIATE]).toBe(0);
  });
});

function fourCategoryPools(
  partial: Partial<Record<PlayerCategory, number>>,
): Partial<Record<PlayerCategory, number>> {
  const base: Partial<Record<PlayerCategory, number>> = {
    [PlayerCategory.MEN_BEGINNER]: 0,
    [PlayerCategory.MEN_INTERMEDIATE]: 0,
    [PlayerCategory.MEN_ADVANCED]: 0,
    [PlayerCategory.WOMEN]: 0,
  };
  return { ...base, ...partial };
}

describe("validateSquadRulesAgainstRoster", () => {
  it("fails when snake draft needs more players than on roster (default)", () => {
    const playersPerCategory = fourCategoryPools({
      [PlayerCategory.MEN_INTERMEDIATE]: 30,
    });
    const caps = computePerTeamCategoryCaps({
      teamCount: 4,
      playersPerCategory,
    });
    const rules = SQUAD_RULE_CATEGORY_ORDER.map((category) => ({
      category,
      maxCount: caps[category],
    }));

    const result = validateSquadRulesAgainstRoster({
      teamCount: 4,
      picksPerTeam: 10,
      totalPlayers: 30,
      playersPerCategory,
      rules,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.errors.some((e) => e.includes("Not enough players"))).toBe(
      true,
    );
  });

  it("passes draft-length check when requireDraftSlotsVsRoster is false (auto-set)", () => {
    const playersPerCategory = fourCategoryPools({
      [PlayerCategory.MEN_INTERMEDIATE]: 30,
    });
    const caps = computePerTeamCategoryCaps({
      teamCount: 4,
      playersPerCategory,
    });
    const rules = SQUAD_RULE_CATEGORY_ORDER.map((category) => ({
      category,
      maxCount: caps[category],
    }));

    const result = validateSquadRulesAgainstRoster({
      teamCount: 4,
      picksPerTeam: 10,
      totalPlayers: 30,
      playersPerCategory,
      rules,
      requireDraftSlotsVsRoster: false,
    });

    expect(result.ok).toBe(true);
  });

  it("fair-share rules always satisfy per-category pool checks", () => {
    const playersPerCategory = fourCategoryPools({
      [PlayerCategory.MEN_BEGINNER]: 17,
      [PlayerCategory.MEN_INTERMEDIATE]: 50,
      [PlayerCategory.MEN_ADVANCED]: 14,
      [PlayerCategory.WOMEN]: 9,
    });
    const teamCount = 4;
    const caps = computePerTeamCategoryCaps({
      teamCount,
      playersPerCategory,
    });
    const rules = SQUAD_RULE_CATEGORY_ORDER.map((category) => ({
      category,
      maxCount: caps[category],
    }));
    const totalPlayers =
      (playersPerCategory[PlayerCategory.MEN_BEGINNER] ?? 0) +
      (playersPerCategory[PlayerCategory.MEN_INTERMEDIATE] ?? 0) +
      (playersPerCategory[PlayerCategory.MEN_ADVANCED] ?? 0) +
      (playersPerCategory[PlayerCategory.WOMEN] ?? 0);

    const result = validateSquadRulesAgainstRoster({
      teamCount,
      picksPerTeam: 10,
      totalPlayers,
      playersPerCategory,
      rules,
      requireDraftSlotsVsRoster: false,
    });

    expect(result.ok).toBe(true);
  });
});

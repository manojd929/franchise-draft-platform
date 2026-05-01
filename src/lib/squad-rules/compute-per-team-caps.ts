import {
  PlayerCategory,
  type PlayerCategory as PlayerCategoryValue,
} from "@/generated/prisma/enums";

/** Stable order matching tournament squad rule rows (all four categories). */
export const SQUAD_RULE_CATEGORY_ORDER: PlayerCategoryValue[] = [
  PlayerCategory.MEN_BEGINNER,
  PlayerCategory.MEN_INTERMEDIATE,
  PlayerCategory.MEN_ADVANCED,
  PlayerCategory.WOMEN,
];

/**
 * Max picks per team from each category so total picks across all teams does not exceed that
 * category's pool (even split per franchise). Independent of snake-draft roster length
 * (`picksPerTeam`): a category cap may exceed how many picks a team gets in the draft; in play,
 * the franchise cannot take more players than it has draft slots.
 */
export function computePerTeamCategoryCaps(params: {
  teamCount: number;
  playersPerCategory: Partial<Record<PlayerCategoryValue, number>>;
}): Record<PlayerCategoryValue, number> {
  const { teamCount, playersPerCategory } = params;
  const result = {} as Record<PlayerCategoryValue, number>;

  for (const category of SQUAD_RULE_CATEGORY_ORDER) {
    const pool = playersPerCategory[category] ?? 0;
    const fairShare =
      teamCount > 0 ? Math.floor(pool / teamCount) : 0;
    result[category] = fairShare;
  }

  return result;
}

/** Skill-ladder order for forms and tables (not alphabetical enum order). */
export function sortBySquadRuleCategoryOrder<
  T extends { category: PlayerCategoryValue },
>(rows: T[]): T[] {
  const orderIndex = new Map(
    SQUAD_RULE_CATEGORY_ORDER.map((category, index) => [category, index]),
  );
  return [...rows].sort(
    (a, b) =>
      (orderIndex.get(a.category) ?? 0) - (orderIndex.get(b.category) ?? 0),
  );
}

/**
 * Starter roster groups created when a tournament is first provisioned — **not** the source of truth.
 * Commissioners rename, archive, add (e.g. Mixed Doubles, Veterans), reorder, and recolor entirely from the
 * Roster groups admin UI (`/categories`). Optional `stableKey` only binds automation hooks (owner stubs,
 * default squad-rule hints for migrated defaults); commissioner-created categories keep `stableKey` null.
 */

export interface DefaultRosterCategorySeedRow {
  stableKey: string;
  name: string;
  displayOrder: number;
  colorHex: string | null;
}

export type TournamentFormat = "DOUBLES_ONLY" | "MIXED" | "SINGLES_ONLY";

export const DEFAULT_ROSTER_CATEGORY_SEEDS: readonly DefaultRosterCategorySeedRow[] = [
  {
    stableKey: "MEN_BEGINNER",
    name: "Men Beginner",
    displayOrder: 0,
    colorHex: "#1e40af",
  },
  {
    stableKey: "MEN_INTERMEDIATE",
    name: "Men Intermediate",
    displayOrder: 1,
    colorHex: "#0f766e",
  },
  {
    stableKey: "MEN_ADVANCED",
    name: "Men Advanced",
    displayOrder: 2,
    colorHex: "#b45309",
  },
  {
    stableKey: "WOMEN",
    name: "Women",
    displayOrder: 3,
    colorHex: "#86198f",
  },
] as const;

/** Default pick caps keyed by seeded stableKeys (parity with legacy DEFAULT_SQUAD_RULES semantics). */
export const DEFAULT_ROSTER_CATEGORY_SQUAD_CAPS: Partial<Record<string, number>> = {
  MEN_ADVANCED: 2,
  MEN_INTERMEDIATE: 4,
  MEN_BEGINNER: 3,
  WOMEN: 1,
};

export const OWNER_STUB_ROSTER_CATEGORY_STABLE_KEY = "MEN_ADVANCED";

const DOUBLES_ONLY_CATEGORY_SEEDS: readonly DefaultRosterCategorySeedRow[] = [
  {
    stableKey: "MENS_DOUBLES",
    name: "Men's Doubles",
    displayOrder: 0,
    colorHex: "#1e40af",
  },
  {
    stableKey: "WOMENS_DOUBLES",
    name: "Women's Doubles",
    displayOrder: 1,
    colorHex: "#be185d",
  },
  {
    stableKey: "MIXED_DOUBLES",
    name: "Mixed Doubles",
    displayOrder: 2,
    colorHex: "#0f766e",
  },
] as const;

const SINGLES_ONLY_CATEGORY_SEEDS: readonly DefaultRosterCategorySeedRow[] = [
  {
    stableKey: "MENS_SINGLES",
    name: "Men's Singles",
    displayOrder: 0,
    colorHex: "#92400e",
  },
  {
    stableKey: "WOMENS_SINGLES",
    name: "Women's Singles",
    displayOrder: 1,
    colorHex: "#7c3aed",
  },
] as const;

const MIXED_CATEGORY_SEEDS: readonly DefaultRosterCategorySeedRow[] = [
  ...DOUBLES_ONLY_CATEGORY_SEEDS,
  ...SINGLES_ONLY_CATEGORY_SEEDS.map((row, index) => ({
    ...row,
    displayOrder: DOUBLES_ONLY_CATEGORY_SEEDS.length + index,
  })),
] as const;

export function getDefaultRosterCategorySeeds(
  format: TournamentFormat,
): readonly DefaultRosterCategorySeedRow[] {
  if (format === "DOUBLES_ONLY") {
    return DOUBLES_ONLY_CATEGORY_SEEDS;
  }
  if (format === "SINGLES_ONLY") {
    return SINGLES_ONLY_CATEGORY_SEEDS;
  }
  return MIXED_CATEGORY_SEEDS;
}

export function isDoublesCategoryName(name: string): boolean {
  return /\bdoubles\b/i.test(name);
}

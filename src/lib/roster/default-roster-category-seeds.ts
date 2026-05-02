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

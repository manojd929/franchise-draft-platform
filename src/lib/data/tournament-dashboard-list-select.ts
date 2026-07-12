import type { Prisma } from "@/generated/prisma/client";

/** Soft-deleted teams/players excluded (matches roster and rules aggregation). */
const activeTeamRelationCountWhere: Prisma.TeamWhereInput = {
  deletedAt: null,
};

const activePlayerRelationCountWhere: Prisma.PlayerWhereInput = {
  deletedAt: null,
};

const activeRosterCategoryRelationCountWhere: Prisma.RosterCategoryWhereInput = {
  archivedAt: null,
};

const teamWithOwnerRelationCountWhere: Prisma.TeamWhereInput = {
  deletedAt: null,
  ownerUserId: { not: null },
};

/**
 * Shape used by dashboard tournament cards and `listTournamentsForUser`.
 * Counts reflect active franchises, active roster rows, and active roster
 * groups only. `teamsWithOwner` reuses the `teams` relation with an extra
 * filter — Prisma allows the same relation to appear multiple times in
 * `_count` when each entry has a distinct where clause and we alias via the
 * client key.
 */
export const tournamentDashboardListSelect = {
  id: true,
  name: true,
  slug: true,
  sport: true,
  format: true,
  draftPhase: true,
  updatedAt: true,
  _count: {
    select: {
      teams: { where: activeTeamRelationCountWhere },
      players: { where: activePlayerRelationCountWhere },
      rosterCategories: { where: activeRosterCategoryRelationCountWhere },
      squadRules: true,
    },
  },
  teams: {
    where: teamWithOwnerRelationCountWhere,
    select: { id: true },
  },
} satisfies Prisma.TournamentSelect;

export type TournamentDashboardListRow = Prisma.TournamentGetPayload<{
  select: typeof tournamentDashboardListSelect;
}>;

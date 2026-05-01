import { UserRole } from "@/generated/prisma/enums";
import type { AssignablePerson } from "@/types/assignable-person";
import { prisma } from "@/lib/prisma";

/**
 * People eligible to be franchise owners for this tournament only:
 * - Franchise-owner role (`UserRole.OWNER`), or already tied to this league (team owner / linked roster row).
 * - Excludes the tournament commissioner entirely (Admin runs separately; use another login).
 * - Excludes league admin accounts (`UserRole.ADMIN`); they run the auction, not franchise bidding.
 * - Excludes random VIEWER accounts that are not stakeholders in this tournament.
 * - Excludes anyone already owning a team in another tournament,
 *   unless they're already an owner in THIS tournament (so edits/reassignment keep labels).
 * - Re-attaches profiles for current-team owners not covered above (odd legacy rows).
 */
export async function buildFranchiseOwnerAssigneeList(params: {
  tournamentId: string;
  commissionerUserId: string;
  existingTeamOwnerIds: string[];
}): Promise<AssignablePerson[]> {
  const busyElsewhereRows = await prisma.team.findMany({
    where: {
      tournamentId: { not: params.tournamentId },
      deletedAt: null,
      ownerUserId: { not: null },
    },
    select: { ownerUserId: true },
  });

  const busyElsewhere = new Set(
    busyElsewhereRows
      .map((row) => row.ownerUserId)
      .filter((id): id is string => Boolean(id)),
  );

  const currentOwners = new Set(
    params.existingTeamOwnerIds.filter((id) => id.trim() !== ""),
  );

  const linkedStakeholders = await prisma.player.findMany({
    where: {
      tournamentId: params.tournamentId,
      deletedAt: null,
      linkedOwnerUserId: { not: null },
    },
    select: { linkedOwnerUserId: true },
  });

  const stakeholderIds = new Set<string>();
  for (const id of params.existingTeamOwnerIds) {
    if (id.trim() !== "") stakeholderIds.add(id);
  }
  for (const row of linkedStakeholders) {
    if (row.linkedOwnerUserId) stakeholderIds.add(row.linkedOwnerUserId);
  }

  const stakeholderIdList =
    stakeholderIds.size > 0 ? [...stakeholderIds] : ([] as string[]);

  const candidates = await prisma.userProfile.findMany({
    where: {
      deletedAt: null,
      role: { not: UserRole.ADMIN },
      id: { not: params.commissionerUserId },
      OR: [
        { role: UserRole.OWNER },
        ...(stakeholderIdList.length > 0
          ? [{ id: { in: stakeholderIdList } }]
          : []),
      ],
    },
    select: { id: true, email: true, displayName: true },
  });

  const assignable = candidates.filter((person) => {
    if (busyElsewhere.has(person.id) && !currentOwners.has(person.id)) {
      return false;
    }
    return true;
  });

  const assignableIds = new Set(assignable.map((person) => person.id));

  const orphanIds = params.existingTeamOwnerIds.filter(
    (id) =>
      id.trim() !== "" &&
      id !== params.commissionerUserId &&
      !assignableIds.has(id),
  );

  const orphans =
    orphanIds.length > 0
      ? await prisma.userProfile.findMany({
          where: {
            id: { in: orphanIds },
            deletedAt: null,
            role: { not: UserRole.ADMIN },
          },
          select: { id: true, email: true, displayName: true },
        })
      : [];

  const merged = new Map<string, AssignablePerson>();
  for (const person of assignable) {
    merged.set(person.id, person);
  }
  for (const person of orphans) {
    merged.set(person.id, person);
  }

  return [...merged.values()].sort((a, b) => {
    const labelA = (a.displayName?.trim() ?? a.email).toLowerCase();
    const labelB = (b.displayName?.trim() ?? b.email).toLowerCase();
    return labelA.localeCompare(labelB);
  });
}

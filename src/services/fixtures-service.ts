import { FixtureMatchType, FixtureSide, FixtureStatus, TournamentFormat } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { assertTournamentOwnership, TournamentServiceError } from "@/services/tournament-service";

function fixturesDelegatesAvailable(): boolean {
  const prismaWithDelegates = prisma as unknown as {
    fixtureTie?: { findMany: (...args: unknown[]) => Promise<unknown> };
    fixtureMatch?: { findMany: (...args: unknown[]) => Promise<unknown> };
  };
  return (
    typeof prismaWithDelegates.fixtureTie?.findMany === "function" &&
    typeof prismaWithDelegates.fixtureMatch?.findMany === "function"
  );
}

export async function getFixturesSummary(tournamentSlug: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { slug: tournamentSlug, deletedAt: null },
    select: { id: true, draftPhase: true, createdById: true },
  });
  if (!tournament) return null;
  if (!fixturesDelegatesAvailable()) {
    return { tournament, ties: [], matches: [], fixturesReady: false };
  }

  const [ties, matches] = await Promise.all([
    prisma.fixtureTie.findMany({
      where: { tournamentId: tournament.id },
      orderBy: [{ roundNumber: "asc" }, { sequence: "asc" }],
      include: {
        teamOne: { select: { id: true, name: true } },
        teamTwo: { select: { id: true, name: true } },
        matches: { select: { id: true, status: true } },
      },
    }),
    prisma.fixtureMatch.findMany({
      where: { tournamentId: tournament.id },
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      include: {
        participants: {
          include: {
            player: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return { tournament, ties, matches, fixturesReady: true };
}

export async function generateRoundRobinTies(params: {
  actorUserId: string;
  tournamentSlug: string;
  matchesPerTie: number;
  categoryLabel?: string;
}) {
  const tournamentId = await assertTournamentOwnership(params.tournamentSlug, params.actorUserId);
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, deletedAt: null },
    select: { id: true, draftPhase: true },
  });
  if (!tournament) throw new TournamentServiceError("Tournament not found.");
  if (tournament.draftPhase !== "COMPLETED") {
    throw new TournamentServiceError("Complete the draft before generating doubles fixtures.");
  }

  const teams = await prisma.team.findMany({
    where: { tournamentId, deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  if (teams.length < 2) throw new TournamentServiceError("At least two teams are required.");
  if (!fixturesDelegatesAvailable()) {
    throw new TournamentServiceError("Fixtures schema is not ready yet. Run database migration first.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.fixtureMatch.deleteMany({ where: { tournamentId } });
    await tx.fixtureTie.deleteMany({ where: { tournamentId } });

    let sequence = 0;
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        const tie = await tx.fixtureTie.create({
          data: {
            tournamentId,
            teamOneId: teams[i].id,
            teamTwoId: teams[j].id,
            roundNumber: i + 1,
            sequence,
            categoryLabel: params.categoryLabel,
          },
        });
        for (let k = 0; k < params.matchesPerTie; k += 1) {
          await tx.fixtureMatch.create({
            data: {
              tournamentId,
              tieId: tie.id,
              matchType: FixtureMatchType.DOUBLES,
              sequence: k,
              status: FixtureStatus.SCHEDULED,
              categoryLabel: params.categoryLabel,
            },
          });
        }
        sequence += 1;
      }
    }
  });
}

export async function createSinglesMatch(params: {
  actorUserId: string;
  tournamentSlug: string;
  playerOneId: string;
  playerTwoId: string;
  categoryLabel?: string;
}) {
  if (params.playerOneId === params.playerTwoId) {
    throw new TournamentServiceError("Select two different players.");
  }
  const tournamentId = await assertTournamentOwnership(params.tournamentSlug, params.actorUserId);
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, deletedAt: null },
    select: { id: true, format: true },
  });
  if (!tournament) throw new TournamentServiceError("Tournament not found.");
  if (tournament.format === TournamentFormat.DOUBLES_ONLY) {
    throw new TournamentServiceError("This tournament is doubles-only. Singles fixtures are disabled.");
  }
  const players = await prisma.player.findMany({
    where: { id: { in: [params.playerOneId, params.playerTwoId] }, tournamentId, deletedAt: null },
    select: { id: true },
  });
  if (players.length !== 2) throw new TournamentServiceError("Players not found in this tournament.");
  if (!fixturesDelegatesAvailable()) {
    throw new TournamentServiceError("Fixtures schema is not ready yet. Run database migration first.");
  }

  const match = await prisma.fixtureMatch.create({
    data: {
      tournamentId,
      matchType: FixtureMatchType.SINGLES,
      status: FixtureStatus.SCHEDULED,
      categoryLabel: params.categoryLabel,
      participants: {
        create: [
          { playerId: params.playerOneId, side: FixtureSide.SIDE_ONE },
          { playerId: params.playerTwoId, side: FixtureSide.SIDE_TWO },
        ],
      },
    },
  });
  return match.id;
}

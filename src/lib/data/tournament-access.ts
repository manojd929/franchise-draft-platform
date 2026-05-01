import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export async function getTournamentBySlug(slug: string) {
  return prisma.tournament.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      createdById: true,
      picksPerTeam: true,
      logoUrl: true,
      colorHex: true,
      draftPhase: true,
    },
  });
}

export async function requireTournamentAccess(slug: string, userId: string) {
  const tournament = await getTournamentBySlug(slug);
  if (!tournament || tournament.createdById !== userId) {
    notFound();
  }
  return tournament;
}

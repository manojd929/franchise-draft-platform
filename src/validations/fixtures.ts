import { z } from "zod";

export const fixturesSlugSchema = z.object({
  tournamentSlug: z.string().min(1),
});

export const generateRoundRobinTiesSchema = z.object({
  tournamentSlug: z.string().min(1),
  matchesPerTie: z.coerce.number().int().min(1).max(15).default(5),
  categoryLabel: z.string().max(120).optional(),
});

export const createSinglesMatchSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerOneId: z.string().uuid(),
  playerTwoId: z.string().uuid(),
  categoryLabel: z.string().max(120).optional(),
});

export const updateFixtureScoreSchema = z.object({
  tournamentSlug: z.string().min(1),
  matchId: z.string().uuid(),
  sideOneScore: z.coerce.number().int().min(0),
  sideTwoScore: z.coerce.number().int().min(0),
});


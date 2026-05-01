import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  picksPerTeam: z.number().int().min(1).max(50).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/u)
    .optional()
    .or(z.literal("")),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = z
  .object({
    tournamentSlug: z.string().min(1),
    name: z.string().min(2).max(120).optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    colorHex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/u)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.logoUrl !== undefined ||
      data.colorHex !== undefined,
    { message: "Nothing to update.", path: ["tournamentSlug"] },
  );

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

export const createTeamSchema = z.object({
  tournamentSlug: z.string().min(1),
  name: z.string().min(2).max(80),
  shortName: z.string().max(8).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/u)
    .optional()
    .or(z.literal("")),
  ownerUserId: z
    .string()
    .max(36)
    .optional()
    .refine(
      (s) =>
        s === undefined ||
        s.trim() === "" ||
        z.string().uuid().safeParse(s.trim()).success,
      { message: "Owner ID must be blank or a valid UUID." },
    ),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  tournamentSlug: z.string().min(1),
  teamId: z.string().uuid(),
  name: z.string().min(2).max(80),
  shortName: z.string().max(8).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/u)
    .optional()
    .or(z.literal("")),
  ownerUserId: z
    .string()
    .max(36)
    .refine(
      (s) =>
        s.trim() === "" || z.string().uuid().safeParse(s.trim()).success,
      { message: "Owner ID must be blank or a valid UUID." },
    ),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const createPlayerSchema = z.object({
  tournamentSlug: z.string().min(1),
  name: z.string().min(1).max(120),
  photoUrl: z.string().url().optional().or(z.literal("")),
  category: z.enum([
    "MEN_BEGINNER",
    "MEN_INTERMEDIATE",
    "MEN_ADVANCED",
    "WOMEN",
  ]),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  notes: z.string().max(500).optional(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerId: z.string().uuid(),
  name: z.string().min(1).max(120),
  photoUrl: z.string().url().optional().or(z.literal("")),
  category: z.enum([
    "MEN_BEGINNER",
    "MEN_INTERMEDIATE",
    "MEN_ADVANCED",
    "WOMEN",
  ]),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  notes: z.string().max(500).optional(),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

export const deleteTournamentSchema = z.object({
  tournamentSlug: z.string().min(1),
});

export type DeleteTournamentInput = z.infer<typeof deleteTournamentSchema>;

export const deletePlayerSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerId: z.string().uuid(),
});

export type DeletePlayerInput = z.infer<typeof deletePlayerSchema>;

export const squadRulesSchema = z.object({
  tournamentSlug: z.string().min(1),
  rules: z
    .array(
      z.object({
        category: z.enum([
          "MEN_BEGINNER",
          "MEN_INTERMEDIATE",
          "MEN_ADVANCED",
          "WOMEN",
        ]),
        maxCount: z.coerce.number().int().min(0).max(50),
      }),
    )
    .length(4),
});

export type SquadRulesInput = z.infer<typeof squadRulesSchema>;

export const draftActionSlugSchema = z.object({
  tournamentSlug: z.string().min(1),
});

export const pickRequestSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export const confirmPickSchema = z.object({
  tournamentSlug: z.string().min(1),
});

export const assignManualSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

export const playerIdSlugSchema = z.object({
  tournamentSlug: z.string().min(1),
  playerId: z.string().uuid(),
});

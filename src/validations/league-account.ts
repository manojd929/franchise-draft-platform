import { z } from "zod";

export const createLeagueOwnerSchema = z.object({
  tournamentSlug: z.string().min(1),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().max(120).optional().or(z.literal("")),
});

export type CreateLeagueOwnerInput = z.infer<typeof createLeagueOwnerSchema>;

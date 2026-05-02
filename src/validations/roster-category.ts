import { z } from "zod";

export const createRosterCategorySchema = z.object({
  tournamentSlug: z.string().min(1),
  name: z.string().min(1).max(120),
  displayOrder: z.coerce.number().int().min(0).max(999).optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/u)
    .optional()
    .or(z.literal("")),
});

export type CreateRosterCategoryInput = z.infer<typeof createRosterCategorySchema>;

export const updateRosterCategorySchema = z.object({
  tournamentSlug: z.string().min(1),
  rosterCategoryId: z.string().uuid(),
  name: z.string().min(1).max(120),
  displayOrder: z.coerce.number().int().min(0).max(999),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/u)
    .optional()
    .or(z.literal("")),
});

export type UpdateRosterCategoryInput = z.infer<typeof updateRosterCategorySchema>;

export const archiveRosterCategorySchema = z.object({
  tournamentSlug: z.string().min(1),
  rosterCategoryId: z.string().uuid(),
});

export type ArchiveRosterCategoryInput = z.infer<typeof archiveRosterCategorySchema>;

export const restoreRosterCategorySchema = z.object({
  tournamentSlug: z.string().min(1),
  rosterCategoryId: z.string().uuid(),
});

export type RestoreRosterCategoryInput = z.infer<typeof restoreRosterCategorySchema>;

export const moveRosterCategoryOrderSchema = z.object({
  tournamentSlug: z.string().min(1),
  rosterCategoryId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export type MoveRosterCategoryOrderInput = z.infer<typeof moveRosterCategoryOrderSchema>;

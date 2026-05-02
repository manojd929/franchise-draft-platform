"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth/session";
import { TournamentServiceError } from "@/services/tournament-service";
import { createSinglesMatch, generateRoundRobinTies } from "@/services/fixtures-service";
import { createSinglesMatchSchema, generateRoundRobinTiesSchema } from "@/validations/fixtures";

type ActionResult = { ok: true } | { ok: false; error: string };

function handle(err: unknown): ActionResult {
  if (err instanceof TournamentServiceError) return { ok: false, error: err.message };
  return { ok: false, error: "Unexpected error. Try again." };
}

export async function generateRoundRobinTiesAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = generateRoundRobinTiesSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const user = await requireSessionUser();
    await generateRoundRobinTies({ actorUserId: user.id, ...parsed.data });
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/fixtures`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/run`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/leaderboard`);
    return { ok: true };
  } catch (error) {
    return handle(error);
  }
}

export async function createSinglesMatchAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = createSinglesMatchSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const user = await requireSessionUser();
    await createSinglesMatch({ actorUserId: user.id, ...parsed.data });
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/fixtures`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/run`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/leaderboard`);
    return { ok: true };
  } catch (error) {
    return handle(error);
  }
}

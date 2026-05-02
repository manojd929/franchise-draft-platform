"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/auth/session";
import {
  togglePlayerElimination,
  toggleTeamElimination,
  updateFixtureMatchState,
} from "@/services/tournament-run-service";
import { TournamentServiceError } from "@/services/tournament-service";
import {
  toggleEntityEliminationSchema,
  updateMatchStateSchema,
} from "@/validations/tournament-run";

type ActionResult = { ok: true } | { ok: false; error: string };

function handle(err: unknown): ActionResult {
  if (err instanceof TournamentServiceError) return { ok: false, error: err.message };
  return { ok: false, error: "Unexpected error. Try again." };
}

export async function updateMatchStateAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = updateMatchStateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const user = await requireSessionUser();
    await updateFixtureMatchState({ actorUserId: user.id, ...parsed.data });
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/run`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/fixtures`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/leaderboard`);
    return { ok: true };
  } catch (error) {
    return handle(error);
  }
}

export async function toggleTeamEliminationAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = toggleEntityEliminationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const user = await requireSessionUser();
    await toggleTeamElimination({
      actorUserId: user.id,
      tournamentSlug: parsed.data.tournamentSlug,
      teamId: parsed.data.entityId,
      eliminated: parsed.data.eliminated,
    });
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/run`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/fixtures`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/leaderboard`);
    return { ok: true };
  } catch (error) {
    return handle(error);
  }
}

export async function togglePlayerEliminationAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = toggleEntityEliminationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request." };
    const user = await requireSessionUser();
    await togglePlayerElimination({
      actorUserId: user.id,
      tournamentSlug: parsed.data.tournamentSlug,
      playerId: parsed.data.entityId,
      eliminated: parsed.data.eliminated,
    });
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/run`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/fixtures`);
    revalidatePath(`/tournament/${parsed.data.tournamentSlug}/leaderboard`);
    return { ok: true };
  } catch (error) {
    return handle(error);
  }
}

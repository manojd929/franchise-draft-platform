import { createClient } from "@supabase/supabase-js";

import { DraftPhase, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import {
  assertTournamentOwnership,
  TournamentServiceError,
} from "@/services/tournament-service";

import type {
  CreateLeagueOwnerForPlayerInput,
  CreateLeagueOwnerInput,
} from "@/validations/league-account";

export async function createLeagueOwnerAccount(
  commissionerUserId: string,
  input: CreateLeagueOwnerInput,
): Promise<{ userId: string; email: string }> {
  const tournamentId = await assertTournamentOwnership(
    input.tournamentSlug,
    commissionerUserId,
  );

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId },
    select: { draftPhase: true },
  });
  if (!tournament) {
    throw new TournamentServiceError("Tournament not found.");
  }
  if (
    tournament.draftPhase !== DraftPhase.SETUP &&
    tournament.draftPhase !== DraftPhase.READY
  ) {
    throw new TournamentServiceError(
      "Cannot create franchise owner logins after the draft configuration is sealed.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceKey?.trim()) {
    throw new TournamentServiceError(
      "Server missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env so commissioners can create owner accounts here.",
    );
  }

  const adminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const displayTrimmed = input.displayName?.trim() ?? "";

  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata:
      displayTrimmed !== ""
        ? {
            full_name: displayTrimmed,
          }
        : undefined,
  });

  if (error) {
    throw new TournamentServiceError(error.message);
  }

  const authUser = data.user;
  if (!authUser) {
    throw new TournamentServiceError("Could not create that login.");
  }

  const resolvedEmail = authUser.email ?? input.email.trim();

  await prisma.userProfile.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: resolvedEmail,
      displayName: displayTrimmed !== "" ? displayTrimmed : null,
      role: UserRole.OWNER,
    },
    update: {
      email: resolvedEmail,
      role: UserRole.OWNER,
      ...(displayTrimmed !== "" ? { displayName: displayTrimmed } : {}),
    },
  });

  return { userId: authUser.id, email: resolvedEmail };
}

export async function createLeagueOwnerForPlayerAccount(
  commissionerUserId: string,
  input: CreateLeagueOwnerForPlayerInput,
): Promise<{ email: string }> {
  const tournamentId = await assertTournamentOwnership(
    input.tournamentSlug,
    commissionerUserId,
  );

  const player = await prisma.player.findFirst({
    where: {
      id: input.playerId,
      tournamentId,
      deletedAt: null,
    },
    select: { id: true, linkedOwnerUserId: true, name: true },
  });

  if (!player) {
    throw new TournamentServiceError("Player not found.");
  }

  if (player.linkedOwnerUserId !== null) {
    throw new TournamentServiceError(
      "This roster row already has a franchise login.",
    );
  }

  const displayTrimmed = input.displayName?.trim() ?? "";
  const displayForInvite =
    displayTrimmed !== "" ? displayTrimmed : player.name.trim();

  const { userId, email } = await createLeagueOwnerAccount(commissionerUserId, {
    tournamentSlug: input.tournamentSlug,
    email: input.email,
    password: input.password,
    displayName: displayForInvite,
  });

  await prisma.player.update({
    where: { id: player.id },
    data: { linkedOwnerUserId: userId },
  });

  return { email };
}

export function isLeagueOwnerInviteConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

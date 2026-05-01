import { createClient } from "@supabase/supabase-js";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import {
  assertTournamentOwnership,
  TournamentServiceError,
} from "@/services/tournament-service";

import type { CreateLeagueOwnerInput } from "@/validations/league-account";

export async function createLeagueOwnerAccount(
  commissionerUserId: string,
  input: CreateLeagueOwnerInput,
): Promise<{ userId: string; email: string }> {
  await assertTournamentOwnership(input.tournamentSlug, commissionerUserId);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceKey?.trim()) {
    throw new TournamentServiceError(
      "Server missing SUPABASE_SERVICE_ROLE_KEY — add it to .env so commissioners can create owner accounts here.",
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
      role: UserRole.VIEWER,
    },
    update: {
      email: resolvedEmail,
      ...(displayTrimmed !== "" ? { displayName: displayTrimmed } : {}),
    },
  });

  return { userId: authUser.id, email: resolvedEmail };
}

export function isLeagueOwnerInviteConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

import { DraftLogAction, DraftPhase } from "@/generated/prisma/enums";
import { ADMIN_LEAGUE_OWNER_PROVISIONING_UNAVAILABLE } from "@/lib/errors/safe-user-feedback";
import { prisma } from "@/lib/prisma";
import {
  isSupabaseAdminConfigured,
  SupabaseAdminUnavailableError,
} from "@/lib/supabase/admin-client";
import {
  provisionOwnerLoginForTournament,
  type OwnerProvisioningResult,
} from "@/services/owner-provisioning";
import { assertTournamentOwnership, TournamentServiceError } from "@/services/tournament-service";

import type {
  CreateLeagueOwnerForPlayerInput,
  CreateLeagueOwnerInput,
} from "@/validations/league-account";

/**
 * Provisions (or links) a team-owner login for the given tournament.
 *
 * Concurrency: safe under two organizers hitting this at the same instant
 * for the same email — the underlying provisioner in
 * `owner-provisioning.ts` re-reads the profile after a Supabase
 * email-conflict error, so the loser of the create race silently links to
 * the just-created profile instead of failing.
 *
 * When `linkedExisting` is `true` in the result, the caller-supplied
 * password was ignored; the existing account keeps its previous password.
 */
export async function createLeagueOwnerAccount(
  organizerUserId: string,
  input: CreateLeagueOwnerInput,
): Promise<{ userId: string; email: string; linkedExisting: boolean }> {
  const tournamentId = await assertTournamentOwnership(input.tournamentSlug, organizerUserId);
  await assertTournamentAcceptsNewOwnerLogins(tournamentId);

  const normalizedEmail = input.email.trim().toLowerCase();
  const displayName = normalizeDisplayName(input.displayName);

  let result: OwnerProvisioningResult;
  try {
    result = await provisionOwnerLoginForTournament({
      requestingUserId: organizerUserId,
      normalizedEmail,
      password: input.password,
      displayName,
    });
  } catch (e) {
    if (e instanceof SupabaseAdminUnavailableError) {
      throw new TournamentServiceError(ADMIN_LEAGUE_OWNER_PROVISIONING_UNAVAILABLE);
    }
    throw e;
  }

  await recordOwnerProvisioningAuditEntry({
    tournamentId,
    organizerUserId,
    result,
  });

  return result;
}

/**
 * Best-effort audit trail so ops can trace which organizer provisioned or
 * linked which owner login and when. We intentionally swallow errors — a
 * failed log write must not roll back a successful provision — and log to
 * the server console so the failure is diagnosable without blocking the
 * caller.
 */
async function recordOwnerProvisioningAuditEntry(params: {
  tournamentId: string;
  organizerUserId: string;
  result: OwnerProvisioningResult;
}): Promise<void> {
  try {
    await prisma.draftLog.create({
      data: {
        tournamentId: params.tournamentId,
        action: DraftLogAction.OWNER_LOGIN_PROVISIONED,
        actorUserId: params.organizerUserId,
        message: params.result.linkedExisting
          ? `Linked existing owner login for ${params.result.email}.`
          : `Created new owner login for ${params.result.email}.`,
        payload: {
          ownerUserId: params.result.userId,
          email: params.result.email,
          linkedExisting: params.result.linkedExisting,
        },
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production" && e instanceof Error) {
      console.error("[owner-provisioning:audit-log]", e.message);
    }
  }
}

async function assertTournamentAcceptsNewOwnerLogins(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId },
    select: { draftPhase: true },
  });
  if (!tournament) {
    throw new TournamentServiceError("Tournament not found.");
  }
  if (tournament.draftPhase !== DraftPhase.SETUP && tournament.draftPhase !== DraftPhase.READY) {
    throw new TournamentServiceError(
      "Cannot create team-owner logins after the draft configuration is sealed.",
    );
  }
}

function normalizeDisplayName(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export async function createLeagueOwnerForPlayerAccount(
  commissionerUserId: string,
  input: CreateLeagueOwnerForPlayerInput,
): Promise<{ email: string; linkedExisting: boolean }> {
  const tournamentId = await assertTournamentOwnership(input.tournamentSlug, commissionerUserId);

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
    throw new TournamentServiceError("This roster row already has a franchise login.");
  }

  const displayTrimmed = input.displayName?.trim() ?? "";
  const displayForInvite = displayTrimmed !== "" ? displayTrimmed : player.name.trim();

  const { userId, email, linkedExisting } = await createLeagueOwnerAccount(commissionerUserId, {
    tournamentSlug: input.tournamentSlug,
    email: input.email,
    password: input.password,
    displayName: displayForInvite,
  });

  if (linkedExisting) {
    const alreadyLinkedInTournament = await prisma.player.findFirst({
      where: {
        tournamentId,
        deletedAt: null,
        linkedOwnerUserId: userId,
      },
      select: { id: true },
    });
    if (alreadyLinkedInTournament) {
      throw new TournamentServiceError(
        "That account already has a franchise login in this tournament. Assign it from Teams instead of granting a new one.",
      );
    }
  }

  /**
   * Conditional update guards against a lost-update race: if two organizers
   * assign a login to the same player concurrently, both see
   * `linkedOwnerUserId: null` on the read above and both try to write. The
   * `where.linkedOwnerUserId: null` clause makes the second write a no-op
   * (0 rows affected) instead of silently overwriting the first winner.
   */
  const linkResult = await prisma.player.updateMany({
    where: { id: player.id, linkedOwnerUserId: null, deletedAt: null },
    data: { linkedOwnerUserId: userId },
  });
  if (linkResult.count === 0) {
    throw new TournamentServiceError(
      "Another organizer just linked a login to this player. Reload the page to see the current state.",
    );
  }

  return { email, linkedExisting };
}

/**
 * Alias kept for existing UI callers. Team-owner-login provisioning requires
 * Supabase admin capability, so this is exactly the same check.
 */
export const isLeagueOwnerInviteConfigured = isSupabaseAdminConfigured;

import type { User } from "@supabase/supabase-js";

import { UserRole } from "@/generated/prisma/enums";
import {
  isAuthEmailConflictMessage,
  leagueOwnerAdminProvisioningUserMessage,
} from "@/lib/errors/safe-user-feedback";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { TournamentServiceError } from "@/services/tournament-errors";

/**
 * Result surface for a successful provisioning call.
 *
 * `linkedExisting` is `true` whenever the returned account was NOT freshly
 * created by this call — either because it already existed in our
 * `UserProfile` table, or because we discovered mid-flight that another
 * concurrent caller had just created it. In both cases, the password the
 * caller passed in was ignored and the account keeps its previous password.
 */
export interface OwnerProvisioningResult {
  userId: string;
  email: string;
  linkedExisting: boolean;
}

export interface OwnerProvisioningInput {
  /** ID of the organizer performing the provisioning; used for the self-owner sanity check. */
  requestingUserId: string;
  /** Pre-normalized (trimmed, lowercased) email. Callers should not pass raw input. */
  normalizedEmail: string;
  /** Plaintext password used only when we create a fresh account. */
  password: string;
  /** Optional display name; falls back to null in the DB. */
  displayName: string | undefined;
}

/**
 * Classification of an existing profile row when we are trying to provision
 * an owner login for it. Pure: same input, same output. Testable without a
 * database.
 */
export type ExistingProfileClassification =
  | { kind: "reject-self"; message: string }
  | { kind: "reject-admin"; message: string }
  | { kind: "link-as-is" }
  | { kind: "link-and-promote" };

/**
 * Given a profile that matched the requested email, decide whether we can
 * link it as an owner login for this tournament.
 *
 * The rules encode business intent, not database state, so this stays
 * separate from the imperative I/O in {@link provisionOwnerLoginForTournament}.
 */
export function classifyExistingProfileForOwnerProvision(
  existing: {
    id: string;
    role: UserRole;
  },
  requestingUserId: string,
): ExistingProfileClassification {
  if (existing.id === requestingUserId) {
    return {
      kind: "reject-self",
      message: "That is your own organizer login. Team owners need a separate account.",
    };
  }
  if (existing.role === UserRole.ADMIN) {
    return {
      kind: "reject-admin",
      message:
        "That email belongs to an organizer/admin account and cannot be granted a team-owner login.",
    };
  }
  if (existing.role === UserRole.OWNER) {
    return { kind: "link-as-is" };
  }
  return { kind: "link-and-promote" };
}

interface RawProfile {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Case-insensitive lookup for a non-deleted profile.
 *
 * Encapsulated so callers (and the race resolver) share one authoritative
 * query and never accidentally forget the `deletedAt: null` guard.
 */
async function lookupProfileByEmail(normalizedEmail: string): Promise<RawProfile | null> {
  const profile = await prisma.userProfile.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
      deletedAt: null,
    },
    select: { id: true, email: true, role: true },
  });
  return profile;
}

/**
 * Applies the classifier to an existing profile and returns the caller-
 * facing result. Throws {@link TournamentServiceError} for reject cases.
 * Idempotent: safe to call twice for the same profile (role promotion is a
 * no-op the second time).
 */
async function linkExistingProfileAsOwner(
  existing: RawProfile,
  requestingUserId: string,
): Promise<OwnerProvisioningResult> {
  const classification = classifyExistingProfileForOwnerProvision(existing, requestingUserId);

  switch (classification.kind) {
    case "reject-self":
      throw new TournamentServiceError(classification.message);
    case "reject-admin":
      throw new TournamentServiceError(classification.message);
    case "link-and-promote":
      await prisma.userProfile.update({
        where: { id: existing.id },
        data: { role: UserRole.OWNER },
      });
      return { userId: existing.id, email: existing.email, linkedExisting: true };
    case "link-as-is":
      return { userId: existing.id, email: existing.email, linkedExisting: true };
  }
}

/**
 * Discriminated result of a Supabase `admin.createUser` call, tuned to the
 * three cases the provisioning flow cares about. Other transport errors are
 * surfaced through the `error` variant.
 */
type SupabaseCreateResult =
  { kind: "created"; user: User } | { kind: "email-conflict" } | { kind: "error"; message: string };

async function createSupabaseAuthUser(
  normalizedEmail: string,
  password: string,
  displayName: string | undefined,
): Promise<SupabaseCreateResult> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: displayName !== undefined ? { full_name: displayName } : undefined,
  });

  if (error) {
    if (isAuthEmailConflictMessage(error.message)) {
      return { kind: "email-conflict" };
    }
    return { kind: "error", message: error.message };
  }
  if (!data.user) {
    return { kind: "error", message: "Auth service did not return a user." };
  }
  return { kind: "created", user: data.user };
}

/**
 * Persist a fresh owner profile after a successful Supabase create. Uses
 * upsert so a duplicate {@link User.id} write (extremely unlikely, but not
 * impossible under retry) is a no-op instead of a constraint error.
 */
async function upsertFreshOwnerProfile(
  authUser: User,
  fallbackEmail: string,
  displayName: string | undefined,
): Promise<OwnerProvisioningResult> {
  const resolvedEmail = authUser.email ?? fallbackEmail;
  await prisma.userProfile.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: resolvedEmail,
      displayName: displayName ?? null,
      role: UserRole.OWNER,
    },
    update: {
      email: resolvedEmail,
      role: UserRole.OWNER,
      ...(displayName !== undefined ? { displayName } : {}),
    },
  });
  return { userId: authUser.id, email: resolvedEmail, linkedExisting: false };
}

/**
 * Backoff schedule in ms for {@link resolveEmailAlreadyRegistered}.
 *
 * When Supabase reports an email conflict, another organizer's fresh-create
 * flow is almost certainly in-flight. That flow's Prisma upsert usually
 * commits within ~50 ms of the Supabase response, but a slow query or high
 * DB load can stretch it. We poll a few times before deciding the account
 * is orphaned — six attempts totaling ~700 ms cover the p99 without
 * blocking the request tab for user-visible durations.
 */
const RACE_RESOLVER_BACKOFF_MS: readonly number[] = Object.freeze([0, 50, 100, 150, 200, 200]);

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Recovery branch invoked when Supabase reports that the email is already
 * registered but our earlier {@link lookupProfileByEmail} did not see it.
 *
 * This happens in two situations:
 * 1. **Concurrent create race** — another organizer just created the
 *    account moments ago; the profile row appears within milliseconds.
 * 2. **Orphan auth user** — the account exists in Supabase but no
 *    `UserProfile` row matches it (e.g., a previous provisioning crashed
 *    between the auth create and the DB upsert). This is not automatically
 *    recoverable here because Supabase's JS SDK does not expose a direct
 *    "get user by email" — reconciliation is an ops task.
 *
 * We poll the profile lookup on the backoff schedule; the moment the row
 * appears, we link and return. If it never appears within the budget we
 * throw an unambiguous error so operations can reconcile.
 */
async function resolveEmailAlreadyRegistered(
  normalizedEmail: string,
  requestingUserId: string,
): Promise<OwnerProvisioningResult> {
  for (const delayMs of RACE_RESOLVER_BACKOFF_MS) {
    if (delayMs > 0) {
      await sleep(delayMs);
    }
    const nowExisting = await lookupProfileByEmail(normalizedEmail);
    if (nowExisting) {
      return linkExistingProfileAsOwner(nowExisting, requestingUserId);
    }
  }

  throw new TournamentServiceError(
    "This email is already registered with the auth service but has no profile in our records. " +
      "Ask an administrator to reconcile it before retrying.",
  );
}

/**
 * Provision an owner login for the given normalized email, safe under
 * concurrent invocation from multiple organizers.
 *
 * Flow:
 * 1. Fast path — read `UserProfile` by email. If found, run the classifier
 *    and link (idempotent).
 * 2. Otherwise — attempt `auth.admin.createUser`.
 *    - Success: upsert `UserProfile` and return `linkedExisting: false`.
 *    - Email conflict (concurrent race or orphan): re-read `UserProfile`.
 *      If it now exists, link. If not, throw an unambiguous
 *      administrator-attention error.
 * 3. Any other Supabase error: surface a translated user message.
 *
 * The password argument is only consulted for the fresh-create case. When
 * the returned `linkedExisting` is `true`, the caller-supplied password was
 * ignored and the account keeps its previous credentials.
 */
export async function provisionOwnerLoginForTournament(
  input: OwnerProvisioningInput,
): Promise<OwnerProvisioningResult> {
  const existing = await lookupProfileByEmail(input.normalizedEmail);
  if (existing) {
    return linkExistingProfileAsOwner(existing, input.requestingUserId);
  }

  const createResult = await createSupabaseAuthUser(
    input.normalizedEmail,
    input.password,
    input.displayName,
  );

  switch (createResult.kind) {
    case "created":
      return upsertFreshOwnerProfile(createResult.user, input.normalizedEmail, input.displayName);
    case "email-conflict":
      return resolveEmailAlreadyRegistered(input.normalizedEmail, input.requestingUserId);
    case "error":
      throw new TournamentServiceError(
        leagueOwnerAdminProvisioningUserMessage(createResult.message),
      );
  }
}

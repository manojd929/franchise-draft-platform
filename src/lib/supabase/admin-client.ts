import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Thrown when the server-side Supabase admin client cannot be constructed
 * because the required env vars are missing. Kept as a distinct error so
 * callers can translate it into the correct user-facing message (usually
 * "administrators must finish configuration").
 */
export class SupabaseAdminUnavailableError extends Error {
  constructor(message = "Supabase admin client is not configured.") {
    super(message);
    this.name = "SupabaseAdminUnavailableError";
  }
}

/**
 * Returns a service-role Supabase client suitable for `auth.admin.*` calls.
 * The client never persists sessions and never refreshes tokens — it's meant
 * for one-shot server operations, not long-lived user sessions.
 *
 * Throws {@link SupabaseAdminUnavailableError} when either
 * `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new SupabaseAdminUnavailableError();
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cheap synchronous check for whether admin-tier features can run in this
 * environment. Callers should prefer catching {@link SupabaseAdminUnavailableError}
 * from `createSupabaseAdminClient` in the actual code path; this helper exists
 * for UI gating (e.g., hiding a button when the feature is not configured).
 */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

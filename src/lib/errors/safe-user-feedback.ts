/** User-visible copy only — maps provider/stack noise to intentional product wording. */

const GENERIC_SIGN_IN = "Could not sign in. Try again.";
const GENERIC_FINALIZE_SESSION = "Could not finalize sign-in. Try again.";

export function authPasswordSignInUserMessage(providerMessage?: string | null): string {
  const m = (providerMessage ?? "").trim().toLowerCase();
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid_credentials") ||
    m.includes("invalid email or password")
  ) {
    return "Incorrect email or password.";
  }
  if (m.includes("email_not_confirmed") || m.includes("email not confirmed")) {
    return "Verify your email before signing in.";
  }
  if (
    m.includes("too_many_requests") ||
    m.includes("too many requests") ||
    m.includes("rate limit")
  ) {
    return "Too many attempts. Wait a moment and try again.";
  }
  return GENERIC_SIGN_IN;
}

export function authSessionFinalizeUserMessage(): string {
  return GENERIC_FINALIZE_SESSION;
}

export function networkOrUnknownSignInUserMessage(internalMessage?: unknown): string {
  if (!(internalMessage instanceof Error)) {
    return GENERIC_SIGN_IN;
  }
  const m = internalMessage.message.trim().toLowerCase();
  if (
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("load failed") ||
    m.includes("aborted")
  ) {
    return "Network issue. Check your connection and try again.";
  }
  return GENERIC_SIGN_IN;
}

export function leagueOwnerAdminProvisioningUserMessage(adminApiMessage?: string | null): string {
  const m = (adminApiMessage ?? "").trim().toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("user already registered") ||
    m.includes("duplicate") ||
    m.includes("unique constraint")
  ) {
    return "That email already has an account.";
  }
  if (m.includes("password") || m.includes("weak") || m.includes("characters")) {
    return "Password does not meet security requirements. Use at least 8 characters.";
  }
  if (m.includes("invalid email") || m.includes("unable to validate email")) {
    return "That email address is invalid or could not be used.";
  }
  return "Could not create that login. Try another email or contact support.";
}

export function franchiseOwnerAuthRemovalFaultUserMessage(): string {
  return "Could not finish updating authentication for that owner. Try again.";
}

export const ADMIN_LEAGUE_OWNER_PROVISIONING_UNAVAILABLE =
  "Franchise owner logins cannot be created from here until system administrators finish configuration.";

export const ADMIN_IMAGE_UPLOAD_UNAVAILABLE =
  "File uploads are not enabled yet. Paste a public HTTPS image URL instead.";

export const ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE =
  "Franchise owner authentication could not be updated. Administrators must finish system configuration.";

export const SIGN_IN_NOT_CONFIGURED =
  "Sign-in is not available on this site yet. Ask your commissioner or administrator.";

export function finalizeSignInServerFaultUserMessage(): string {
  return GENERIC_FINALIZE_SESSION;
}

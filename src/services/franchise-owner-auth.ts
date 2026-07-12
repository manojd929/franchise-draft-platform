import { UserRole } from "@/generated/prisma/enums";
import { ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE } from "@/lib/errors/safe-user-feedback";
import { prisma } from "@/lib/prisma";
import {
  createSupabaseAdminClient,
  SupabaseAdminUnavailableError,
} from "@/lib/supabase/admin-client";

/**
 * Deletes the auth-backed user profile when nothing references this id as a franchise owner.
 * No-op if teams or players still reference the user.
 */
export async function deleteAuthUserIfNoOwnerReferences(userId: string): Promise<void> {
  const ownsTeam = await prisma.team.count({
    where: { deletedAt: null, ownerUserId: userId },
  });
  if (ownsTeam > 0) {
    return;
  }

  const linkedPlayers = await prisma.player.count({
    where: { deletedAt: null, linkedOwnerUserId: userId },
  });
  if (linkedPlayers > 0) {
    return;
  }

  const profile = await prisma.userProfile.findFirst({
    where: { id: userId, deletedAt: null },
    select: { role: true },
  });
  if (!profile) {
    return;
  }
  if (profile.role === UserRole.ADMIN) {
    return;
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (e) {
    if (e instanceof SupabaseAdminUnavailableError) {
      throw new Error(ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE);
    }
    throw e;
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[franchise-owner-auth:deleteUser]", error.message);
    }
    throw new Error(ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE);
  }

  await prisma.userProfile.updateMany({
    where: { id: userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

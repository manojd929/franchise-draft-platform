import { createClient } from "@supabase/supabase-js";

import { UserRole } from "@/generated/prisma/enums";
import { ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE } from "@/lib/errors/safe-user-feedback";
import { prisma } from "@/lib/prisma";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url?.trim() || !serviceKey?.trim()) {
    throw new Error(ADMIN_FRANCHISE_OWNER_AUTH_UNAVAILABLE);
  }

  const adminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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

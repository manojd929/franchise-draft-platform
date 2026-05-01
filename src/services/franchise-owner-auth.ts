import { createClient } from "@supabase/supabase-js";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * Deletes Supabase Auth user and soft-deletes `UserProfile` when nothing references this id as a franchise owner.
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
    throw new Error(
      "Server missing SUPABASE_SERVICE_ROLE_KEY. Add it so owner logins can be removed from authentication.",
    );
  }

  const adminClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }

  await prisma.userProfile.updateMany({
    where: { id: userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

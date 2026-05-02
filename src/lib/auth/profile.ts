import type { User } from "@supabase/supabase-js";

import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function syncUserProfile(user: User): Promise<void> {
  const email = user.email ?? `${user.id}@users.local`;
  const existing = await prisma.userProfile.findFirst({
    where: { id: user.id },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt !== null) {
    throw new Error("Access denied");
  }
  if (existing.role !== UserRole.ADMIN && existing.role !== UserRole.OWNER) {
    throw new Error("Access denied");
  }

  await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      email,
      displayName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined,
    },
  });
}

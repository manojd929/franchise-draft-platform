import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export async function syncUserProfile(user: User): Promise<void> {
  const email = user.email ?? `${user.id}@users.local`;
  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email,
      displayName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
    },
    update: {
      email,
      displayName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined,
    },
  });
}

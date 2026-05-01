import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient, UserRole } from "../src/generated/prisma/client";

/**
 * Fixed UUID so this profile can match a Supabase Auth user when you create one
 * with the same id (Dashboard → Authentication → Users → Add user, or local Supabase).
 */
const LOCAL_ADMIN_USER_ID = "a0000000-0000-4000-8000-000000000001";
const LOCAL_ADMIN_EMAIL = "admin@localhost.local";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.userProfile.upsert({
    where: { email: LOCAL_ADMIN_EMAIL },
    create: {
      id: LOCAL_ADMIN_USER_ID,
      email: LOCAL_ADMIN_EMAIL,
      displayName: "Local Admin",
      role: UserRole.ADMIN,
    },
    update: {
      role: UserRole.ADMIN,
      displayName: "Local Admin",
    },
  });

  console.info(`Seeded admin UserProfile: ${LOCAL_ADMIN_EMAIL} (${LOCAL_ADMIN_USER_ID})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

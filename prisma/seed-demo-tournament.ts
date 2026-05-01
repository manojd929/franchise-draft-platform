/**
 * Demo tournament: two franchised teams with owners + twenty men's intermediate pool players.
 *
 * Intended for **local or staging** provisioning only. Run manually; never from Vercel build.
 *
 * Required env:
 * - DATABASE_URL
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env (defaults suit local demo accounts):
 * - DEMO_SEED_COMMISSIONER_EMAIL / DEMO_SEED_COMMISSIONER_PASSWORD
 * - DEMO_SEED_OWNER_1_EMAIL / DEMO_SEED_OWNER_1_PASSWORD
 * - DEMO_SEED_OWNER_2_EMAIL / DEMO_SEED_OWNER_2_PASSWORD
 * - DEMO_SEED_TOURNAMENT_NAME (default: Demo Two-Owner League)
 * - NEXT_PUBLIC_APP_ORIGIN: printed hub URLs (default http://localhost:3000)
 *
 * Credential printing:
 * - DEMO_SEED_PRINT_CREDENTIALS=1: always print passwords to stdout
 * - DEMO_SEED_PRINT_CREDENTIALS=0: never print passwords (recommended for shared logs / CI)
 * - If unset: passwords print only when NODE_ENV !== "production"
 *
 * Run: npm run seed:demo-tournament
 */
import "dotenv/config";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { Gender, PlayerCategory, UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  createTeam,
  createTournament,
  reconcileSquadRulesForTournament,
  syncOwnerPlayersForTournament,
} from "@/services/tournament-service";

const POOL_PLAYER_COUNT = 20;

const DEFAULT_COMMISSIONER_EMAIL = "commissioner-demo@draftforge.local";
const DEFAULT_COMMISSIONER_PASSWORD = "DemoCommissioner2026!";
const DEFAULT_OWNER_1_EMAIL = "owner1-demo@draftforge.local";
const DEFAULT_OWNER_1_PASSWORD = "DemoOwner1!Pass";
const DEFAULT_OWNER_2_EMAIL = "owner2-demo@draftforge.local";
const DEFAULT_OWNER_2_PASSWORD = "DemoOwner2!Pass";
const DEFAULT_TOURNAMENT_NAME = "Demo Two-Owner League";

/** Caps full-directory scans when resolving existing Auth users by email. */
const MAX_AUTH_LIST_PAGES = 50;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function resolveDemoCredentials(): {
  commissionerEmail: string;
  commissionerPassword: string;
  owner1Email: string;
  owner1Password: string;
  owner2Email: string;
  owner2Password: string;
  tournamentName: string;
} {
  return {
    commissionerEmail:
      process.env.DEMO_SEED_COMMISSIONER_EMAIL?.trim() || DEFAULT_COMMISSIONER_EMAIL,
    commissionerPassword:
      process.env.DEMO_SEED_COMMISSIONER_PASSWORD?.trim() || DEFAULT_COMMISSIONER_PASSWORD,
    owner1Email: process.env.DEMO_SEED_OWNER_1_EMAIL?.trim() || DEFAULT_OWNER_1_EMAIL,
    owner1Password: process.env.DEMO_SEED_OWNER_1_PASSWORD?.trim() || DEFAULT_OWNER_1_PASSWORD,
    owner2Email: process.env.DEMO_SEED_OWNER_2_EMAIL?.trim() || DEFAULT_OWNER_2_EMAIL,
    owner2Password: process.env.DEMO_SEED_OWNER_2_PASSWORD?.trim() || DEFAULT_OWNER_2_PASSWORD,
    tournamentName:
      process.env.DEMO_SEED_TOURNAMENT_NAME?.trim() || DEFAULT_TOURNAMENT_NAME,
  };
}

function shouldPrintCredentialsToStdout(): boolean {
  const explicit = process.env.DEMO_SEED_PRINT_CREDENTIALS?.trim();
  if (explicit === "1") return true;
  if (explicit === "0") return false;
  return process.env.NODE_ENV !== "production";
}

function createServiceRoleClient(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  emailNormalized: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;

  for (let pages = 0; pages < MAX_AUTH_LIST_PAGES; pages += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const hit = data.users.find(
      (u) => u.email?.toLowerCase() === emailNormalized.toLowerCase(),
    );
    if (hit) return hit.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureAuthUserWithProfile(params: {
  admin: SupabaseClient;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}): Promise<string> {
  const existingId = await findAuthUserIdByEmail(params.admin, params.email);

  if (existingId) {
    const { error: updErr } = await params.admin.auth.admin.updateUserById(existingId, {
      password: params.password,
      email_confirm: true,
      user_metadata: { full_name: params.displayName },
    });
    if (updErr) throw updErr;

    await prisma.userProfile.upsert({
      where: { id: existingId },
      create: {
        id: existingId,
        email: params.email,
        displayName: params.displayName,
        role: params.role,
      },
      update: {
        email: params.email,
        displayName: params.displayName,
        role: params.role,
      },
    });

    return existingId;
  }

  const { data, error } = await params.admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { full_name: params.displayName },
  });

  if (error) throw error;
  if (!data.user) {
    throw new Error(`Supabase Admin did not return a user for ${params.email}`);
  }

  const id = data.user.id;

  await prisma.userProfile.upsert({
    where: { id },
    create: {
      id,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
    },
    update: {
      email: params.email,
      displayName: params.displayName,
      role: params.role,
    },
  });

  return id;
}

async function seedPoolPlayers(tournamentId: string): Promise<void> {
  await prisma.player.createMany({
    data: Array.from({ length: POOL_PLAYER_COUNT }, (_, index) => {
      const n = String(index + 1).padStart(2, "0");
      return {
        tournamentId,
        name: `Pool Player ${n}`,
        category: PlayerCategory.MEN_INTERMEDIATE,
        gender: Gender.MALE,
      };
    }),
  });
}

async function main(): Promise<void> {
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Demo seed must not run on Vercel. Run locally or from a secure maintenance host with DATABASE_URL pointed at your database.",
    );
  }

  requireEnv("DATABASE_URL");
  const adminUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const creds = resolveDemoCredentials();
  const admin = createServiceRoleClient(adminUrl, serviceKey);
  const printSecrets = shouldPrintCredentialsToStdout();

  console.info("Provisioning demo users in Supabase Auth…");

  const commissionerId = await ensureAuthUserWithProfile({
    admin,
    email: creds.commissionerEmail,
    password: creds.commissionerPassword,
    displayName: "Demo Commissioner",
    role: UserRole.ADMIN,
  });

  const owner1Id = await ensureAuthUserWithProfile({
    admin,
    email: creds.owner1Email,
    password: creds.owner1Password,
    displayName: "Demo Owner One",
    role: UserRole.OWNER,
  });

  const owner2Id = await ensureAuthUserWithProfile({
    admin,
    email: creds.owner2Email,
    password: creds.owner2Password,
    displayName: "Demo Owner Two",
    role: UserRole.OWNER,
  });

  console.info(`Creating tournament "${creds.tournamentName}"…`);

  const { slug } = await createTournament(commissionerId, {
    name: creds.tournamentName,
    picksPerTeam: 10,
  });

  const tournament = await prisma.tournament.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true },
  });

  if (!tournament) {
    throw new Error("Tournament was not found immediately after create.");
  }

  await createTeam(commissionerId, {
    tournamentSlug: slug,
    name: "North Franchise",
    ownerUserId: owner1Id,
  });

  await createTeam(commissionerId, {
    tournamentSlug: slug,
    name: "South Franchise",
    ownerUserId: owner2Id,
  });

  await syncOwnerPlayersForTournament(tournament.id);

  console.info(`Adding ${String(POOL_PLAYER_COUNT)} men's intermediate players…`);
  await seedPoolPlayers(tournament.id);

  await reconcileSquadRulesForTournament(tournament.id);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.trim() || "http://localhost:3000";

  console.info("\n── Demo tournament ready ──");
  console.info(`Slug: ${slug}`);
  console.info(`Hub:  ${baseUrl}/tournament/${slug}`);
  console.info(`Admin: ${baseUrl}/tournament/${slug}/admin`);
  console.info(`Owner board: ${baseUrl}/tournament/${slug}/owner`);

  if (printSecrets) {
    console.info("\n── Logins (handle stdout like a secret; demo only) ──");
    console.info("Commissioner (runs Admin / league setup)");
    console.info(`  Email: ${creds.commissionerEmail}`);
    console.info(`  Password: ${creds.commissionerPassword}`);
    console.info("Owner 1: North Franchise");
    console.info(`  Email: ${creds.owner1Email}`);
    console.info(`  Password: ${creds.owner1Password}`);
    console.info("Owner 2: South Franchise");
    console.info(`  Email: ${creds.owner2Email}`);
    console.info(`  Password: ${creds.owner2Password}`);
  } else {
    console.info(
      "\nPasswords were not printed (DEMO_SEED_PRINT_CREDENTIALS=0 or production mode). Set DEMO_SEED_PRINT_CREDENTIALS=1 to print.",
    );
  }

  console.info(
    "\nNote: Two linked owner stub players (men advanced) are auto-created for roster rules.",
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

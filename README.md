# DraftForge · Franchise draft platform

**DraftForge** is a web app for running **live snake drafts** for sports clubs and leagues: franchises (teams), athlete roster photos, **fair pick order**, squad caps by category, and an **organizer vs franchise-owner** workflow where nominees send a pick and the **commissioner confirms** it before it lands on the board.

Built with **Next.js 16** (App Router), **React 19**, **PostgreSQL** via **Prisma 7**, **Supabase Auth**, and optional **Vercel Blob** for images.

---

## Features

### Tournaments & branding

- **Slug-based hubs** (`/tournament/[slug]`): landing cards for Admin, TV, Auction, Owner phone, Teams, Players, Rules.
- **Branding**: name, accent color (`colorHex`), optional logo uploaded to Blob when configured.
- **Lifecycle**: commissioner creates tournaments from **Dashboard**; tournaments can be **soft-deleted**.
- **`picksPerTeam`**: configurable roster depth for the snake schedule.

### Access & roles

- **Commissioner** (tournament `createdById`): full setup (**Teams**, **Players**, **Rules**), runs **Admin** (shuffle, phases, confirm/undo, overrides), edits hub branding when logged in.
- **Franchise owner**: separate Supabase login; nominates picks on **Auction** or **Owner** when `Team.ownerUserId` matches; cannot confirm picks.
- **Commissioner guardrails**: commissioner **cannot** be assigned as a team owner (`UserRole` / assignee rules in `franchise-owner-assignees`).
- **`UserProfile.role`**: `ADMIN`, `OWNER`, `VIEWER`; league owner accounts provisioned via service role receive `OWNER`.
- **Route protection** (`src/lib/supabase/middleware.ts` + page checks): **`/tournament/[slug]/tv`** is **public** (no login) for projector use; almost all other app/tournament URLs require Supabase session. **Teams / Players / Rules / Admin** use `requireTournamentAccess` (commissioner-only).

### Franchise owner accounts (Supabase Admin API)

Requires **`SUPABASE_SERVICE_ROLE_KEY`** (server-only, never expose to the client).

- **Create owner login** from the **Teams** invite flow (`createLeagueOwnerAccount`): email/password, `email_confirm: true`, upserts `UserProfile` as `OWNER`.
- **Grant login from a roster row** (`createLeagueOwnerForPlayerAccount`): ties new auth user to `Player.linkedOwnerUserId` when the commissioner provisions credentials from **Players**.
- **Revoke** login from player (`revokeFranchiseLoginFromPlayer`): clears link once not still assigned as a **team** owner.
- **Remove owner from tournament** (`deleteFranchiseOwnerFromTournament`): clears `Team.ownerUserId` and `Player.linkedOwnerUserId` for that owner; blocked outside `SETUP` / `READY`.
- **Orphan cleanup** (`deleteAuthUserIfNoOwnerReferences`): deletes Supabase user and soft-deletes profile when nothing references them; never removes `ADMIN` profiles.

Eligible assignees for team ownership are derived from **`buildFranchiseOwnerAssigneeList`** (OWNER role / already linked-or-owning-in-this-league / not commissioner / not owning another tournament’s team unless already in this one, etc.).

### Teams & ordering

- **Teams**: display order, optional short name, colors, logos, optional `ownerUserId`.
- **Snake draft order**: `DraftOrderSlot` rows; organizer **shuffle** persists order and logs `ORDER_RANDOMIZED`.
- **`draftOrderLocked`**: ordering sealed for go-live workflows as implemented in draft service.

### Players & roster tooling

- **Categories**: Men Beginner / Intermediate / Advanced, Women (`PlayerCategory` enum).
- **Gender**: `Gender` enum on each player.
- **Flags**: unavailable, locked roster rows (`isUnavailable`, `isLocked`).
- **Photos** and notes; optional **`linkedOwnerUserId`** for franchise-login linkage and assignee eligibility.
- **Soft delete** players.

### Squad rules

- **`SquadRule`**: unique per `(tournamentId, category)` cap (`maxCount`).
- **Rules page**: commissioner-only; includes pick-limit guidance (`pick-limits-guidance`), squad form, reconcile/auto-fill helpers from `reconcileSquadRulesForTournament` / squad utilities.

### Draft runtime

- **`DraftPhase`**: `SETUP` → `READY` → `LIVE` → pause/freeze/lock/completed semantics as surfaced in UI and enforced in **`draft-service`**.
- **Pending nomination** stored on **`Tournament`**: `pendingPickPlayerId`, `pendingPickTeamId`, idempotency key for duplicate nominate clicks.
- **Confirmed picks**: `Pick` rows (unique `(tournamentId, playerId)`), `confirmedByUserId`, `PickStatus.CONFIRMED` for persisted board state.
- **Validation**: roster caps / availability unless **`overrideValidation`** (admin-only toggle with audit via `DraftLog`).
- **`pickTimerSeconds`**: surfaced in snapshot/DTO for UI timing affordances where wired.
- **Admin actions**: start/pause/resume/freeze/unlock/lock, advance/revert/skip turn, shuffle, confirm pick, undo (clears pending or removes last confirmed), force sync variants as implemented, validation override confirmation.

### Client experiences

| Route | Audience | Behavior |
|-------|----------|----------|
| `/tournament/[slug]` | Signed-in users | Hub + commissioner branding edit |
| `/tournament/[slug]/teams` | Commissioner | CRUD teams, invite/grant franchise logins |
| `/tournament/[slug]/players` | Commissioner | Roster CRUD, grant/revoke franchise login per row |
| `/tournament/[slug]/rules` | Commissioner | Squad caps |
| `/tournament/[slug]/draft` | Signed-in | Auction board filters + nominate when allowed |
| `/tournament/[slug]/owner` | Signed-in | Phone-first owner view; same nominate path |
| `/tournament/[slug]/admin` | Commissioner | Control room |
| `/tournament/[slug]/tv` | **Public** | Read-only-ish big-screen client |

### Realtime-ish updates & API

- **Polling**: `useDraftLiveSync` hits **`GET /api/tournaments/[slug]/snapshot`** on an interval (~3.5s) when the tab is visible.
- **Optional Supabase Realtime**: Postgres changes on **`Tournament`** (`id.eq.{uuid}`) trigger an immediate snapshot refresh when Realtime replication is configured in Supabase.

**Operational note**: the snapshot JSON route does not authenticate by default; secrecy relies on tournament **slug** (and HTTPS). Commissioners should treat URLs as sensitive if unpublished player data matters.

---

## Architecture (high level)

| Layer | Responsibility |
|-------|----------------|
| **`src/app/`** | Routes, redirects, composing server components |
| **`src/features/**`** | Server actions (`actions.ts`), feature forms/dialogs |
| **`src/services/**`** | Transactions, domain rules (`draft-service`, `tournament-service`, `league-account-service`, `franchise-owner-auth`) |
| **`src/lib/**`** | Prisma client, Supabase SSR/browser clients, uploads, guards (`tournament-access`, assignee helpers) |
| **`prisma/schema.prisma`** | Source of truth for enums/models/migrations |

Request pipeline: **`src/proxy.ts`** bundles the middleware matcher + delegates to **`src/lib/supabase/middleware.ts`** for Supabase cookie refresh and auth redirects (see **`src/proxy.ts`** matcher). Draft rules stay off thin HTTP handlers aside from **`GET /api/tournaments/[slug]/snapshot`**.

---

## Data model highlights (`prisma/schema.prisma`)

- **Soft deletes**: `deletedAt` on `UserProfile`, `Tournament`, `Team`, `Player` (retain FK integrity and history-friendly queries).
- **Enums** (`UserRole`, `PlayerCategory`, `Gender`, `DraftPhase`, `PickStatus`, `DraftLogAction`) avoid magic strings in SQL.
- **`Tournament`**: draft phase, timer, slot index, locked order flags, pending pick columns, **`overrideValidation`**, timestamps for draft start/end.
- **`DraftOrderSlot`**: materialized snake order `{ slotIndex → teamId }`.
- **`Pick`**: one row per drafted player (`@@unique([tournamentId, playerId])`).
- **`DraftLog`**: append-only audit (`action`, `message`, optional JSON `payload`, `actorUserId`).
- **Ownership graph**: `Team.ownerUserId` → `UserProfile`; `Player.linkedOwnerUserId` for commissioner-provisioned “stub owner” linkage (`@@unique([tournamentId, linkedOwnerUserId])`).

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16, React 19 |
| UI | Tailwind CSS 4, Base UI primitives, shadcn-style patterns |
| Data | Prisma 7, `@prisma/adapter-pg`, `pg` |
| Auth | Supabase SSR (cookies) + service role for admin user provisioning |
| Storage | Vercel Blob (optional) for logos and player photos |
| Validation | Zod |
| Tests | Vitest |

---

## Prerequisites

- **Node.js** 20+ recommended (align with Vercel defaults).
- **PostgreSQL** database (Supabase hosted Postgres works well).
- **Supabase project** for authentication (`NEXT_PUBLIC_*` + anon key + **service role** for commissioner-created owner accounts).

---

## GitHub repository name & Vercel

The canonical repo slug is **`franchise-draft-platform`**. If yours still exists as **`franchise-draft-platofrm`** (typo), fix it on GitHub:

1. Open the repo on GitHub → **Settings** → **General** → **Repository name** → set to `franchise-draft-platform` → **Rename**.
2. Update any local clone:

   ```bash
   git remote set-url origin git@github.com:manojd929/franchise-draft-platform.git
   git fetch origin
   ```

3. **Vercel:** Open the project → **Settings** → **Git**. Confirm the connected repository is `manojd929/franchise-draft-platform`. If it still shows the old name or deploys do not run, use **Disconnect** (if available) and reconnect Git to the renamed repo.

**CLI alternative** (from the repo root, with [GitHub CLI](https://cli.github.com/) logged in): `gh repo rename franchise-draft-platform`

GitHub redirects the old URL for a while after rename, but Vercel should target the correct repository name so production hooks stay reliable.

---

## Getting started

### 1. Clone and install

```bash
git clone git@github.com:manojd929/franchise-draft-platform.git
cd franchise-draft-platform
npm install
```

### 2. Environment

Copy the template and fill in real values:

```bash
cp .env.example .env
```

See **[Environment variables](#environment-variables)** below. Never commit `.env`.

### 3. Database

Generate the client and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

For a fresh Supabase DB, use the **session pooler** URL on port **5432** for Prisma CLI (`DIRECT_URL` in `.env.example`) so migrations work reliably over IPv4.

### 4. Baseline profile seed (optional)

Creates a fixed local admin profile row used in some dev setups:

```bash
npx tsx prisma/seed.ts
```

You still need a matching **Supabase Auth** user (same UUID) or sign up through the app so `UserProfile` syncs on login.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres URL for the running app (often Supabase **transaction** pooler `:6543` + `pgbouncer=true`). |
| `DIRECT_URL` | Yes for CLI | Postgres URL for **`prisma migrate`** (often **session** pooler `:5432`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (browser + server). |
| `SUPABASE_SERVICE_ROLE_KEY` | For owner provisioning | Server-only; powers franchise owner Auth user create/delete flows. |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob; enables upload buttons for logos/photos. |
| `NEXT_PUBLIC_APP_ORIGIN` | Optional | Canonical site URL (e.g. Vercel prod URL); used when printing links from demo seed. |

Demo-only seed toggles (`DEMO_SEED_*`, `DEMO_SEED_PRINT_CREDENTIALS`) are documented in **`prisma/seed-demo-tournament.ts`** and `.env.example`.

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production / CI) |
| `npm run db:push` | Push schema without migration files (prototyping only) |
| `npm run seed:demo-tournament` | Provisions demo Supabase users + tournament (**run locally**, see script header) |

---

## Screens at draft time

| Screen | Who | Purpose |
|--------|-----|---------|
| **Admin** (`/tournament/[slug]/admin`) | Commissioner | Shuffle order, phase controls, **confirm** picks, pause/skip/advance, overrides |
| **Auction** (`/tournament/[slug]/draft`) | Commissioner + franchise owners (+ other signed-in helpers) | Board, filters; nominate when it is your team’s clock |
| **Owner phone** (`/tournament/[slug]/owner`) | Franchise owner | Same nominate UX, tuned copy for phones |
| **Big screen** (`/tournament/[slug]/tv`) | Everyone in the room | Large read-mostly display (**no login**) |

---

## Deployment (Vercel)

1. Connect this repo to Vercel and set **all** env vars from `.env.example` (production values).
2. Ensure **`npm run build`** succeeds (`postinstall` runs **`prisma generate`**).
3. Run **`npm run db:migrate:deploy`** against production **once per migration change** (GitHub Action, Vercel deploy hook, or manual from a trusted machine). Use `DIRECT_URL` / non-pgbouncer URL for migrate if your provider requires it.
4. Do **not** run **`seed:demo-tournament`** on Vercel; it refuses when `VERCEL=1`.

Optional: configure Supabase Auth **redirect URLs** for your production domain (login callback).

---

## Project layout (high level)

```
src/app/           # App Router routes (marketing, dashboard, tournament/*, API snapshot)
src/components/    # Shared UI and draft-room pieces
src/features/      # Feature modules (forms, server actions)
src/services/      # Domain services (draft, tournament, league accounts)
src/lib/           # Auth, Prisma, Supabase, uploads, access helpers
src/proxy.ts       # Middleware entry (session refresh + auth redirects)
prisma/            # Schema, migrations, seeds
```

Core draft logic lives in **`src/services/draft-service.ts`**. Tournament setup and provisioning live in **`src/services/tournament-service.ts`** plus **`src/services/league-account-service.ts`**.

---

## Other product surfaces

- **Settings** (`/settings`): account header actions; placeholders for future profile preferences.

---

## License

Private / all rights reserved unless you add an explicit `LICENSE` file.

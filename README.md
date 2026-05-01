# DraftForge · Franchise draft platform

**DraftForge** is a web app for running **live snake drafts** for sports clubs and leagues: franchises (teams), athlete roster photos, **fair pick order**, squad caps by category, and a separate **organizer** vs **owner** flow so picks are nominated then confirmed.

Built with **Next.js 16** (App Router), **React 19**, **PostgreSQL** via **Prisma**, **Supabase Auth**, and optional **Vercel Blob** for images.

---

## Features

- **Tournaments** — slug-based hubs with branding (name, accent color, logo).
- **Teams & owners** — assign each franchise to a logged-in owner (UUID synced from Supabase).
- **Players** — categories (men beginner / intermediate / advanced, women), gender, photos, availability flags.
- **Squad rules** — per-category caps per team; recomputed from roster size and franchise count where applicable.
- **Snake draft** — randomized order (organizer), round-robin snake slots, live phase controls (pause, freeze, lock).
- **Auction board** — filtered grid of players; owners tap to nominate when it is their turn.
- **Admin control room** — start/pause draft, confirm or undo picks, advance turn, optional validation override (with confirmation dialog).
- **TV display** — simplified board for a projector.
- **Realtime-ish updates** — polling plus optional Supabase Realtime on tournament rows.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16, Turbopack |
| UI | React 19, Tailwind CSS 4, shadcn-style primitives (Base UI) |
| Data | Prisma 7, `@prisma/adapter-pg`, `pg` |
| Auth | Supabase (SSR cookie sessions, service role for admin user provisioning) |
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
| `SUPABASE_SERVICE_ROLE_KEY` | For owner invites | Server-only; powers “create franchise owner login”. |
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

## How roles work at draft time

| Screen | Who | Purpose |
|--------|-----|---------|
| **Admin** (`/tournament/[slug]/admin`) | Tournament creator (commissioner) | Shuffle order, start draft, **confirm** picks, pause/skip/advance. |
| **Auction board** (`/draft`) | Everyone | Browse players and filters. |
| **Owner** (`/owner`) | Franchise owner on their phone | Request a pick when it is their slot; commissioner confirms on Admin. |
| **Big screen** (`/tv`) | Room display | Large read-only-friendly view. |

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
src/app/           # App Router routes (marketing, dashboard, tournament/*)
src/components/    # Shared UI and draft-room pieces
src/features/      # Feature modules (forms, server actions)
src/services/      # Domain services (draft, tournament)
src/lib/           # Auth, Prisma, Supabase, uploads
prisma/            # Schema, migrations, seeds
src/proxy.ts       # Edge proxy (session refresh + auth redirects)
```

Business logic for drafts lives in **`src/services/draft-service.ts`** and **`src/services/tournament-service.ts`**.

---

## License

Private / all rights reserved unless you add an explicit `LICENSE` file.

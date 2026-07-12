# Multi-division tournaments — design & migration plan

**Status:** Proposed. Not implemented.
**Owner:** TBD
**Blocked by:** Nothing; can start when scheduled.

---

## Problem

Today `Tournament.format` is a single enum (`DOUBLES_ONLY | MIXED | SINGLES_ONLY`).
An organizer who runs a real-world event with **Men's Doubles + Women's
Doubles + Mixed Doubles + Singles** has to create four separate
tournaments — which forces four separate auctions, four separate rosters,
and four separate leaderboards for what the club considers one event.

The user-visible ask is:

> "A single tournament can contain multiple formats of playing. For example,
> I can host a tournament and have doubles, men's doubles, women's doubles,
> and mixed doubles, but I feel I have to create each tournament for these
> use cases."

## Goal

A **Division** primitive under a Tournament:

```
Tournament (Summer Smash 2026)
  ├── Division · Men's Doubles       (matchType=DOUBLES, gender=MEN_ONLY)
  ├── Division · Women's Doubles     (matchType=DOUBLES, gender=WOMEN_ONLY)
  ├── Division · Mixed Doubles       (matchType=DOUBLES, gender=MIXED_REQUIRED)
  └── Division · Singles             (matchType=SINGLES, gender=OPEN)
```

- Owners buy players **once** at the tournament level.
- Fixtures, standings, and knockouts are computed **per division**.
- The auction UI can either (a) auction each division separately or
  (b) share one player pool and let owners enter players into whichever
  divisions they qualify for. Recommendation: option (b) — matches how
  club events actually work.

## Schema changes

### New model

```prisma
enum DivisionMatchType {
  DOUBLES
  SINGLES
}

enum DivisionGenderRule {
  OPEN
  MEN_ONLY
  WOMEN_ONLY
  MIXED_REQUIRED   // exactly one male + one female on court
}

model Division {
  id             String              @id @default(uuid()) @db.Uuid
  tournamentId   String              @db.Uuid
  name           String              // "Men's Doubles"
  sequence       Int                 @default(0)
  matchType      DivisionMatchType
  genderRule     DivisionGenderRule  @default(OPEN)
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  deletedAt      DateTime?

  tournament     Tournament          @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  fixtureTies    FixtureTie[]
  fixtureMatches FixtureMatch[]

  @@unique([tournamentId, name])
  @@index([tournamentId, sequence])
}
```

### Field changes

- `Tournament.format` → **keep for backward compat during transition**;
  new divisions live in `Tournament.divisions`. Deprecate reads of
  `Tournament.format` after backfill completes.
- `FixtureTie.divisionId String? @db.Uuid` — new FK.
  `FixtureTie.categoryLabel` already exists but is free text; migrate its
  values into `Division.name` during backfill.
- `FixtureMatch.divisionId String? @db.Uuid` — same story.
- `FixtureMatch.matchType` — keep. Divisions carry the authoritative
  `matchType`; fixture rows can be validated against their division's
  match type in the service layer.

## Backfill migration

Written as a single Prisma migration + a one-off script:

1. Add `Division` table and nullable `divisionId` columns on fixtures.
2. For every existing tournament:
   - Read `format`.
   - Insert one or two divisions matching the format:
     - `DOUBLES_ONLY` → one division "Doubles" (`DOUBLES`, `OPEN`).
     - `SINGLES_ONLY` → one division "Singles" (`SINGLES`, `OPEN`).
     - `MIXED` → two divisions "Doubles" + "Singles".
   - Update every existing fixture row: `divisionId = <matched division>`
     using `matchType` to pick.
3. Add a follow-up migration (a release later) that promotes
   `FixtureTie.divisionId` and `FixtureMatch.divisionId` to NOT NULL and
   deletes `Tournament.format`.

Split the migrations so the app can ship divisions without a
schema-breaking cutover — old code paths keep working during the rollout.

## Service-layer impact

The pieces that read `Tournament.format` today:

- Fixture generation (`src/services/tournament-service.ts`,
  `src/services/fixtures-service.ts` if present) — must read from the
  division list instead of the enum.
- Leaderboard aggregation — group by division, not tournament.
- Draft/auction — no change if the shared-pool model is picked. If per-
  division auctions are picked instead, add `Pick.divisionId` and enforce
  purse per division.
- Validation: `assertPlayerEligibleForDivision(player, division)` for
  gender rules on entry.

## UI impact

- **Create tournament form** (`create-tournament-form.tsx`): replace the
  single-format dropdown with an inline division editor. Preset chips —
  "Men's D", "Women's D", "Mixed D", "Singles" — add with one tap;
  custom labels supported. Removing the last division blocks the form.
- **Setup checklist** (`tournament-setup-checklist.ts`): add a step
  "Divisions configured" before "Roster groups".
- **Fixtures page** (`/tournament/[slug]/fixtures`): group by division;
  add a division tab bar at the top.
- **Leaderboard** (`/tournament/[slug]/leaderboard`): division tabs
  with per-division standings.
- **Run tournament / Knockout board**: division filter.

## Roll-out phases

Ship in three PRs so nothing is half-migrated on any given commit:

1. **PR 1 (schema + backfill)**: add `Division`, add nullable
   `divisionId` on fixtures, run the backfill script, keep
   `Tournament.format` alive. No UI change.
2. **PR 2 (UI)**: division editor in create-tournament, division tabs on
   fixtures/leaderboard/knockouts, service layer reads from divisions.
   Keep the old format code paths as fallback for any row that missed
   the backfill.
3. **PR 3 (cleanup)**: `divisionId` becomes NOT NULL. Drop
   `Tournament.format` and the migration fallback. Delete
   `TOURNAMENT_FORMAT_LABEL`.

## Estimated effort

- PR 1 (schema + backfill + script): ~1 day. Risk: touching production
  data; needs staging rehearsal.
- PR 2 (UI + service layer): ~2–3 days. The fixtures/leaderboard grouping
  is the substantive part.
- PR 3 (cleanup): ~2 hours.

## Open questions

- Shared player pool vs per-division auction. Recommend shared — matches
  club reality and avoids splitting purses.
- What happens when a doubles pair straddles two divisions (a couple
  entered in Mixed and also individually in Men's D)? Recommend allowing
  a `FixtureMatchParticipant` to belong to a player who plays in
  multiple divisions; enforce only that the same player isn't in two
  matches at the same time slot (scheduling concern, not schema).
- Gender rule enforcement: hard block at entry, or warn-and-allow so
  organizers can override? Recommend warn-and-allow, since gender labels
  can be edge cases.

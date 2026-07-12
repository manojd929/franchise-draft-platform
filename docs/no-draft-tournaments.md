# Draft-less tournaments — design & migration plan

**Status:** Proposed. Not implemented.
**Owner:** TBD
**Depends on:** Nothing structurally; composes cleanly with
[multi-division-tournaments.md](./multi-division-tournaments.md) if both
land.

---

## Problem

Today every tournament assumes the flow **Roster groups → Teams → Owners →
Draft/Auction → Fixtures**. `RANDOM_ASSIGNMENT` already lets an organizer
one-tap-shuffle the pool into teams, but you still need teams and franchise
owners as containers.

Not every real event needs any of that. A club running "twelve people show
up, arrange them into matches, play the tournament" has to fake the
draft/auction/owners layer today.

The user ask:

> "There should be an ability where, once you add all the players, the
> tournament organizes itself by itself rather than owners or any of these
> things. Just the list of players who would be participating in a
> tournament, and then organize a tournament between them by setting match
> schedules and whatnot fixtures."

## Goal

A tournament with **no teams, no owners, no picks, no auction** — just
players and a schedule.

Concretely, add two orthogonal knobs:

```
AllocationMethod (how squads are formed)   ×   FixtureBasis (what plays what)
  SNAKE_DRAFT                                    TEAM_VS_TEAM      (today's default)
  RANDOM_ASSIGNMENT                              PAIR_VS_PAIR      (doubles pairings, no teams)
  LIVE_AUCTION                                   PLAYER_VS_PLAYER  (singles ladder)
  NONE  ← NEW                                    (any of the three, per organizer choice)
```

`AllocationMethod = NONE` skips the entire team-formation phase. Players
go directly into fixtures.

## Schema changes

Three narrow additions; no destructive rewrites of existing tables.

```prisma
enum AllocationMethod {
  NONE            // NEW: skip team formation entirely
  SNAKE_DRAFT
  RANDOM_ASSIGNMENT
  LIVE_AUCTION
}

enum FixtureBasis {   // NEW
  TEAM_VS_TEAM        // uses FixtureTie.teamOne/teamTwo
  PAIR_VS_PAIR        // doubles pairings, no team layer
  PLAYER_VS_PLAYER    // singles
}

model Tournament {
  // ... existing fields
  fixtureBasis   FixtureBasis @default(TEAM_VS_TEAM)
}

model FixtureTie {
  // teamOneId / teamTwoId become nullable so PAIR_VS_PAIR and
  // PLAYER_VS_PLAYER fixtures can be represented without inventing
  // synthetic team rows.
  teamOneId String? @db.Uuid
  teamTwoId String? @db.Uuid
  // ... existing fields
}

model FixturePairing {   // NEW: for PAIR_VS_PAIR (draft-less doubles pairings)
  id            String @id @default(uuid()) @db.Uuid
  tournamentId  String @db.Uuid
  playerOneId   String @db.Uuid
  playerTwoId   String @db.Uuid
  displayName   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tournament Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  playerOne  Player     @relation("PairingPlayerOne", fields: [playerOneId], references: [id])
  playerTwo  Player     @relation("PairingPlayerTwo", fields: [playerTwoId], references: [id])

  @@unique([tournamentId, playerOneId, playerTwoId])
  @@index([tournamentId])
}
```

`FixtureMatchParticipant.teamId` is **already nullable** in the current
schema, so `PLAYER_VS_PLAYER` singles fixtures work at the row level today
— only the fixture-tie/generation layer needs to change.

## Backfill migration

1. Add `AllocationMethod.NONE` and `FixtureBasis` enum. Add
   `Tournament.fixtureBasis` with `DEFAULT 'TEAM_VS_TEAM'` so every
   existing row lands in the same behavior it has today.
2. Drop `NOT NULL` on `FixtureTie.teamOneId` and `teamTwoId`.
3. Create `FixturePairing` table.
4. Backfill is a no-op for `Tournament.fixtureBasis` — the default handles
   it — but leave a defensive `UPDATE tournament SET fixture_basis =
   'TEAM_VS_TEAM' WHERE fixture_basis IS NULL` in case any row slipped
   through.

## Service-layer impact

The pieces that must branch on `fixtureBasis`:

- **Fixture generation** ([services/fixtures-service.ts:288
  `generateRoundRobinTies`](../src/services/fixtures-service.ts)): the
  current implementation is hard-coded to `Team`. Extract the pairwise
  scheduling into a pure helper (`buildRoundRobinPairSchedule(entities)`),
  then two thin wrappers:
  - `generateTeamRoundRobinTies` — today's flow.
  - `generatePlayerOrPairRoundRobinTies` — reads `Player[]` (singles) or
    `FixturePairing[]` (doubles) and emits `FixtureTie` rows with team FKs
    null and `FixtureMatchParticipant` rows for each side.
- **Leaderboard / standings**: today aggregates by team. Add a
  `resultRollupSubject` that resolves to team, pairing, or player based on
  `fixtureBasis`.
- **Draft / auction**: skipped entirely when `allocationMethod === NONE`.
  The phase machine short-circuits — `SETUP` moves directly to `COMPLETED`
  the moment the organizer marks setup done, unlocking fixture generation.

## Setup checklist becomes conditional

The [tournament-setup-checklist helper we built](../src/lib/tournaments/tournament-setup-checklist.ts)
already has the right structure. When `allocationMethod === NONE`:

- Drop **Teams**, **Owners**, and **Rules** steps.
- Add **Fixture format** (round-robin / knockout / hybrid) as a step.
- The setup collapses to: **Roster groups → Players → Format → Schedule**.

For `PAIR_VS_PAIR`, add a **Pairings** step between Players and Format.

## UI impact

- **Create tournament form**
  ([features/tournaments/create-tournament-form.tsx](../src/features/tournaments/create-tournament-form.tsx)):
  add a fourth option to the "How are teams formed?" radio group:

  > **Just a schedule** — No draft, no auction. Add players and generate
  > fixtures directly.

  Selecting it hides auction fields, hides the Picks-per-team input, and
  shows the new "Fixture basis" radio (players vs. pairs).

- **Tournament shell nav**
  ([lib/navigation/tournament-nav-links.ts](../src/lib/navigation/tournament-nav-links.ts)):
  hide **Teams**, **Rules**, **Draft**, and **Owner** tabs when
  `allocationMethod === NONE`. `tournamentChromeNavGroups` already takes a
  viewer param; add a `hasTeams: boolean` flag.

- **Fixtures page** ([app/tournament/[slug]/fixtures](../src/app/tournament)):
  reads `fixtureBasis` and picks a renderer — the existing team-based
  table for `TEAM_VS_TEAM`, a new pair-based table for `PAIR_VS_PAIR`, a
  new player-based table for `PLAYER_VS_PLAYER`.

- **Category-level "no owner" scope** (mentioned in the audit): treated
  here as a whole-tournament property. If a hybrid is needed later (some
  divisions drafted, some scheduled directly), that's the
  [multi-division PR chain](./multi-division-tournaments.md) — each
  `Division` gets its own `allocationMethod` and `fixtureBasis`. The two
  features stack.

## Rollout phases

Three PRs, in order, so nothing is half-migrated on any given commit.

1. **PR 1 (schema + backfill)**: add the enum + column + nullable FKs +
   `FixturePairing` table. Run backfill. `AllocationMethod.NONE` is
   unreachable from the UI at this point — no behavioral change.
2. **PR 2 (UI + fixture generator)**: add the "Just a schedule" option,
   the conditional checklist, and `generatePlayerOrPairRoundRobinTies`.
   Nav-tab filtering. Fixtures page splits its rendering by basis.
   Existing draft/auction paths untouched.
3. **PR 3 (leaderboard + polish)**: standings grouping by
   `resultRollupSubject`; knockout-board handling for player-based
   fixtures.

## Effort estimate

- PR 1 (schema): ~half a day. Migration risk is low — additive only,
  defaults keep existing rows compatible.
- PR 2 (UI + generator): ~2–3 days. Most of the work is the fixture
  generator (needs its own test suite matching `generateRoundRobinTies`
  behavior) and the conditional UI.
- PR 3 (leaderboard): ~1 day. Small if we've kept aggregation code
  parameterized.

## Open questions

- Should `PAIR_VS_PAIR` support **mixed-doubles constraints** at the
  pairing UI (one M + one F per pair)? Suggest yes when the multi-division
  work lands; otherwise open pairings.
- **Knockout** for player-based fixtures: reuse the existing bracket
  primitives with players as leaves, or add a dedicated player-bracket
  model? Suggest reuse; a bracket entry is already "one side, one score"
  which handles either.
- **Ad-hoc scheduling** (no round-robin, organizer creates individual
  matches by hand): already supported by `createFixtureTie` +
  `createTieMatch`; we just need to expose that path in the draft-less
  UI too.

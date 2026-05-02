-- Flexible roster categories; remove PlayerCategory enum; optional tournament player entry fee (minor units + ISO currency).

-- CreateTable
CREATE TABLE "RosterCategory" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "colorHex" TEXT,
    "archivedAt" TIMESTAMP(3),
    "stableKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RosterCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable Tournament
ALTER TABLE "Tournament" ADD COLUMN "playerEntryFeeMinorUnits" INTEGER,
ADD COLUMN "playerEntryFeeCurrencyCode" VARCHAR(3) NOT NULL DEFAULT 'INR';

-- Seed one row per legacy enum variant for every tournament
INSERT INTO "RosterCategory" ("id", "tournamentId", "name", "displayOrder", "colorHex", "archivedAt", "stableKey", "createdAt", "updatedAt")
SELECT gen_random_uuid(), t."id", v."name", v."displayOrder", v."colorHex", NULL, v."stableKey", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Tournament" t
CROSS JOIN (
  VALUES
    ('Men Beginner', 0, '#1e40af', 'MEN_BEGINNER'),
    ('Men Intermediate', 1, '#0f766e', 'MEN_INTERMEDIATE'),
    ('Men Advanced', 2, '#b45309', 'MEN_ADVANCED'),
    ('Women', 3, '#86198f', 'WOMEN')
) AS v("name", "displayOrder", "colorHex", "stableKey");

-- AddForeignKey
ALTER TABLE "RosterCategory" ADD CONSTRAINT "RosterCategory_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable attach FK columns before dropping enum-backed columns
ALTER TABLE "Player" ADD COLUMN "rosterCategoryId" UUID;

ALTER TABLE "SquadRule" ADD COLUMN "rosterCategoryId" UUID;

UPDATE "Player" p
SET "rosterCategoryId" = rc."id"
FROM "RosterCategory" rc
WHERE rc."tournamentId" = p."tournamentId"
  AND rc."stableKey" = p."category"::TEXT;

UPDATE "SquadRule" sr
SET "rosterCategoryId" = rc."id"
FROM "RosterCategory" rc
WHERE rc."tournamentId" = sr."tournamentId"
  AND rc."stableKey" = sr."category"::TEXT;

ALTER TABLE "Player" ALTER COLUMN "rosterCategoryId" SET NOT NULL;

ALTER TABLE "SquadRule" ALTER COLUMN "rosterCategoryId" SET NOT NULL;

-- DropForeignKey indexes linked to obsolete enum columns
DROP INDEX IF EXISTS "Player_category_idx";

DROP INDEX IF EXISTS "SquadRule_tournamentId_category_key";

ALTER TABLE "Player" DROP COLUMN "category";

ALTER TABLE "SquadRule" DROP COLUMN "category";

DROP TYPE "PlayerCategory";

-- CreateIndex
CREATE INDEX "RosterCategory_tournamentId_idx" ON "RosterCategory"("tournamentId");

CREATE UNIQUE INDEX "RosterCategory_tournamentId_stableKey_key" ON "RosterCategory"("tournamentId", "stableKey");

CREATE INDEX "Player_rosterCategoryId_idx" ON "Player"("rosterCategoryId");

CREATE UNIQUE INDEX "SquadRule_tournamentId_rosterCategoryId_key" ON "SquadRule"("tournamentId", "rosterCategoryId");

-- AddForeignKey Player / SquadRule -> RosterCategory
ALTER TABLE "Player" ADD CONSTRAINT "Player_rosterCategoryId_fkey" FOREIGN KEY ("rosterCategoryId") REFERENCES "RosterCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SquadRule" ADD CONSTRAINT "SquadRule_rosterCategoryId_fkey" FOREIGN KEY ("rosterCategoryId") REFERENCES "RosterCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

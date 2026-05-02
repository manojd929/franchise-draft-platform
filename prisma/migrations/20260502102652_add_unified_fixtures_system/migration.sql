-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('DOUBLES_ONLY', 'MIXED', 'SINGLES_ONLY');

-- CreateEnum
CREATE TYPE "FixtureMatchType" AS ENUM ('SINGLES', 'DOUBLES');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FixtureSide" AS ENUM ('SIDE_ONE', 'SIDE_TWO');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "format" "TournamentFormat" NOT NULL DEFAULT 'DOUBLES_ONLY';

-- CreateTable
CREATE TABLE "FixtureTie" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "categoryLabel" TEXT,
    "roundNumber" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "teamOneId" UUID NOT NULL,
    "teamTwoId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixtureTie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixtureMatch" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "tieId" UUID,
    "categoryLabel" TEXT,
    "matchType" "FixtureMatchType" NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" "FixtureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sideOneScore" INTEGER,
    "sideTwoScore" INTEGER,
    "winnerSide" "FixtureSide",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixtureMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixtureMatchParticipant" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "side" "FixtureSide" NOT NULL,
    "teamId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixtureMatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixtureTie_tournamentId_sequence_idx" ON "FixtureTie"("tournamentId", "sequence");

-- CreateIndex
CREATE INDEX "FixtureMatch_tournamentId_sequence_idx" ON "FixtureMatch"("tournamentId", "sequence");

-- CreateIndex
CREATE INDEX "FixtureMatch_tieId_sequence_idx" ON "FixtureMatch"("tieId", "sequence");

-- CreateIndex
CREATE INDEX "FixtureMatchParticipant_matchId_side_idx" ON "FixtureMatchParticipant"("matchId", "side");

-- CreateIndex
CREATE INDEX "FixtureMatchParticipant_playerId_idx" ON "FixtureMatchParticipant"("playerId");

-- CreateIndex
CREATE INDEX "FixtureMatchParticipant_teamId_idx" ON "FixtureMatchParticipant"("teamId");

-- AddForeignKey
ALTER TABLE "FixtureTie" ADD CONSTRAINT "FixtureTie_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureTie" ADD CONSTRAINT "FixtureTie_teamOneId_fkey" FOREIGN KEY ("teamOneId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureTie" ADD CONSTRAINT "FixtureTie_teamTwoId_fkey" FOREIGN KEY ("teamTwoId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureMatch" ADD CONSTRAINT "FixtureMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureMatch" ADD CONSTRAINT "FixtureMatch_tieId_fkey" FOREIGN KEY ("tieId") REFERENCES "FixtureTie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureMatchParticipant" ADD CONSTRAINT "FixtureMatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "FixtureMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureMatchParticipant" ADD CONSTRAINT "FixtureMatchParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixtureMatchParticipant" ADD CONSTRAINT "FixtureMatchParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

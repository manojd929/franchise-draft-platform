-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'VIEWER');

-- CreateEnum
CREATE TYPE "PlayerCategory" AS ENUM ('MEN_BEGINNER', 'MEN_INTERMEDIATE', 'MEN_ADVANCED', 'WOMEN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "DraftPhase" AS ENUM ('SETUP', 'READY', 'LIVE', 'PAUSED', 'FROZEN', 'LOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PickStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "DraftLogAction" AS ENUM ('DRAFT_STARTED', 'DRAFT_PAUSED', 'DRAFT_RESUMED', 'DRAFT_ENDED', 'DRAFT_FROZEN', 'DRAFT_UNLOCKED', 'DRAFT_LOCKED', 'TURN_ADVANCED', 'TURN_REVERTED', 'TURN_SKIPPED', 'ORDER_RANDOMIZED', 'PICK_REQUESTED', 'PICK_CONFIRMED', 'PICK_UNDONE', 'PICK_REMOVED', 'PLAYER_ASSIGNED', 'PLAYER_UNAVAILABLE', 'PLAYER_LOCKED', 'SYNC_FORCED', 'OVERRIDE_VALIDATION', 'ERROR');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdById" UUID NOT NULL,
    "draftPhase" "DraftPhase" NOT NULL DEFAULT 'SETUP',
    "picksPerTeam" INTEGER NOT NULL DEFAULT 10,
    "currentSlotIndex" INTEGER NOT NULL DEFAULT 0,
    "draftOrderLocked" BOOLEAN NOT NULL DEFAULT false,
    "pendingPickPlayerId" UUID,
    "pendingPickTeamId" UUID,
    "pendingIdempotencyKey" TEXT,
    "overrideValidation" BOOLEAN NOT NULL DEFAULT false,
    "pickTimerSeconds" INTEGER,
    "draftStartedAt" TIMESTAMP(3),
    "draftEndedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "logoUrl" TEXT,
    "colorHex" TEXT,
    "ownerUserId" UUID,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "category" "PlayerCategory" NOT NULL,
    "gender" "Gender" NOT NULL,
    "notes" TEXT,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SquadRule" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "category" "PlayerCategory" NOT NULL,
    "maxCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SquadRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftOrderSlot" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "teamId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftOrderSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "status" "PickStatus" NOT NULL DEFAULT 'CONFIRMED',
    "idempotencyKey" TEXT,
    "confirmedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftLog" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "action" "DraftLogAction" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "actorUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "UserProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_pendingPickPlayerId_key" ON "Tournament"("pendingPickPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_pendingPickTeamId_key" ON "Tournament"("pendingPickTeamId");

-- CreateIndex
CREATE INDEX "Tournament_createdById_idx" ON "Tournament"("createdById");

-- CreateIndex
CREATE INDEX "Tournament_draftPhase_idx" ON "Tournament"("draftPhase");

-- CreateIndex
CREATE INDEX "Team_tournamentId_idx" ON "Team"("tournamentId");

-- CreateIndex
CREATE INDEX "Team_ownerUserId_idx" ON "Team"("ownerUserId");

-- CreateIndex
CREATE INDEX "Player_tournamentId_idx" ON "Player"("tournamentId");

-- CreateIndex
CREATE INDEX "Player_category_idx" ON "Player"("category");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "SquadRule_tournamentId_idx" ON "SquadRule"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "SquadRule_tournamentId_category_key" ON "SquadRule"("tournamentId", "category");

-- CreateIndex
CREATE INDEX "DraftOrderSlot_tournamentId_idx" ON "DraftOrderSlot"("tournamentId");

-- CreateIndex
CREATE INDEX "DraftOrderSlot_teamId_idx" ON "DraftOrderSlot"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftOrderSlot_tournamentId_slotIndex_key" ON "DraftOrderSlot"("tournamentId", "slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_idempotencyKey_key" ON "Pick"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Pick_tournamentId_idx" ON "Pick"("tournamentId");

-- CreateIndex
CREATE INDEX "Pick_teamId_idx" ON "Pick"("teamId");

-- CreateIndex
CREATE INDEX "Pick_slotIndex_idx" ON "Pick"("slotIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_tournamentId_playerId_key" ON "Pick"("tournamentId", "playerId");

-- CreateIndex
CREATE INDEX "DraftLog_tournamentId_createdAt_idx" ON "DraftLog"("tournamentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_pendingPickPlayerId_fkey" FOREIGN KEY ("pendingPickPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_pendingPickTeamId_fkey" FOREIGN KEY ("pendingPickTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SquadRule" ADD CONSTRAINT "SquadRule_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOrderSlot" ADD CONSTRAINT "DraftOrderSlot_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftOrderSlot" ADD CONSTRAINT "DraftOrderSlot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftLog" ADD CONSTRAINT "DraftLog_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftLog" ADD CONSTRAINT "DraftLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

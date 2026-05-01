-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "colorHex" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN "linkedOwnerUserId" UUID;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_linkedOwnerUserId_fkey" FOREIGN KEY ("linkedOwnerUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Player_tournamentId_linkedOwnerUserId_key" ON "Player"("tournamentId", "linkedOwnerUserId");

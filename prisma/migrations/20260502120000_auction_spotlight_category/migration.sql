-- AlterEnum
ALTER TYPE "DraftLogAction" ADD VALUE 'AUCTION_FOCUS_CATEGORY';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "activeAuctionRosterCategoryId" UUID;

ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_activeAuctionRosterCategoryId_fkey" FOREIGN KEY ("activeAuctionRosterCategoryId") REFERENCES "RosterCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "extraListings" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "startedAt" TIMESTAMP(3);

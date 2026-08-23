-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "listingLimit" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "ListingCreditPurchase" (
    "id" SERIAL NOT NULL,
    "agentId" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paypalOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingCreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingCreditPurchase_paypalOrderId_key" ON "ListingCreditPurchase"("paypalOrderId");

-- AddForeignKey
ALTER TABLE "ListingCreditPurchase" ADD CONSTRAINT "ListingCreditPurchase_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "DiscoveredLead" (
    "id" SERIAL NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "excerpt" TEXT,
    "city" TEXT,
    "propertyType" TEXT,
    "budgetMin" DOUBLE PRECISION,
    "budgetMax" DOUBLE PRECISION,
    "requiredSize" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewNotes" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiscoveredLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscoveredLead_sourceUrl_key"
ON "DiscoveredLead"("sourceUrl");

CREATE INDEX "DiscoveredLead_status_createdAt_idx"
ON "DiscoveredLead"("status", "createdAt");

CREATE INDEX "DiscoveredLead_city_propertyType_idx"
ON "DiscoveredLead"("city", "propertyType");

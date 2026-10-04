CREATE TABLE "WantToSell" (
  "id" SERIAL NOT NULL,
  "ownerName" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "email" TEXT,
  "city" TEXT NOT NULL,
  "propertyAddress" TEXT NOT NULL,
  "propertyType" TEXT,
  "propertySize" TEXT,
  "expectedPrice" TEXT,
  "tenure" TEXT,
  "bumiStatus" TEXT,
  "additionalDetails" TEXT,
  "assignedAgentId" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WantToSell_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WantToSell"
ADD CONSTRAINT "WantToSell_assignedAgentId_fkey"
FOREIGN KEY ("assignedAgentId") REFERENCES "Agent"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "WantToBuy" (
    "id" SERIAL NOT NULL,
    "buyerName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "propertyType" TEXT,
    "requiredSize" TEXT,
    "budget" TEXT,
    "basicSalary" DOUBLE PRECISION,
    "bankCommitment" DOUBLE PRECISION,
    "ctosCcrisStatus" TEXT,
    "loanTenure" INTEGER,
    "interestRate" DOUBLE PRECISION,
    "maxDsr" DOUBLE PRECISION,
    "availableMonthly" DOUBLE PRECISION,
    "estimatedLoan" DOUBLE PRECISION,
    "estimatedPropertyPrice" DOUBLE PRECISION,
    "additionalRequirements" TEXT,
    "assignedAgentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WantToBuy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WantToBuy"
ADD CONSTRAINT "WantToBuy_assignedAgentId_fkey"
FOREIGN KEY ("assignedAgentId")
REFERENCES "Agent"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

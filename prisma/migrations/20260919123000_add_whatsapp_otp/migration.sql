ALTER TABLE "Agent"
ADD COLUMN "whatsappNumber" TEXT,
ADD COLUMN "verificationCodeHash" TEXT,
ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationAttempts" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Agent_whatsappNumber_key"
ON "Agent"("whatsappNumber");

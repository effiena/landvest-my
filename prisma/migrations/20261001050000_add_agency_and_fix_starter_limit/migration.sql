-- Add agency as nullable first so existing agents are preserved.
ALTER TABLE "Agent"
ADD COLUMN "agency" TEXT;

-- Give existing agents a placeholder agency.
UPDATE "Agent"
SET "agency" = 'Not Provided'
WHERE "agency" IS NULL;

-- Make agency required for all future agents.
ALTER TABLE "Agent"
ALTER COLUMN "agency" SET NOT NULL;

-- Starter accounts should have a maximum of 2 free listings.
ALTER TABLE "Agent"
ALTER COLUMN "listingLimit" SET DEFAULT 2;

UPDATE "Agent"
SET "listingLimit" = 2
WHERE "plan" = 'starter'
  AND "listingLimit" > 2;

-- Remove obsolete PayPal fields.
DROP INDEX IF EXISTS "ListingCreditPurchase_paypalOrderId_key";
DROP INDEX IF EXISTS "Subscription_paypalId_key";

ALTER TABLE "ListingCreditPurchase"
DROP COLUMN IF EXISTS "paypalOrderId";

ALTER TABLE "Subscription"
DROP COLUMN IF EXISTS "paypalId";

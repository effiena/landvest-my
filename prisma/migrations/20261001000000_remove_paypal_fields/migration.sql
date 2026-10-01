DROP INDEX IF EXISTS "Subscription_paypalId_key";
DROP INDEX IF EXISTS "ListingCreditPurchase_paypalOrderId_key";

ALTER TABLE "Subscription"
DROP COLUMN IF EXISTS "paypalId";

ALTER TABLE "ListingCreditPurchase"
DROP COLUMN IF EXISTS "paypalOrderId";

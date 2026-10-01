-- Add Stripe identifiers for Professional subscriptions
ALTER TABLE "Subscription"
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "stripeCustomerId" TEXT;

-- Add Stripe identifiers for one-time listing credit purchases
ALTER TABLE "ListingCreditPurchase"
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "stripePaymentId" TEXT;

-- Unique indexes for Stripe identifiers
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key"
ON "Subscription"("stripeSubscriptionId");

CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key"
ON "Subscription"("stripeCustomerId");

CREATE UNIQUE INDEX "ListingCreditPurchase_stripeSessionId_key"
ON "ListingCreditPurchase"("stripeSessionId");

CREATE UNIQUE INDEX "ListingCreditPurchase_stripePaymentId_key"
ON "ListingCreditPurchase"("stripePaymentId");

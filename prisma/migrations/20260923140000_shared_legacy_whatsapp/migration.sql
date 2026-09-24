ALTER TABLE "Agent"
DROP CONSTRAINT IF EXISTS "Agent_whatsappNumber_key";

ALTER TABLE "Agent"
ADD COLUMN "legacySharedWhatsApp" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Agent_whatsappNumber_new_users_key"
ON "Agent" ("whatsappNumber")
WHERE "legacySharedWhatsApp" = false
  AND "whatsappNumber" IS NOT NULL;

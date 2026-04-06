-- Workspace-scoped business data: add workspaceId, backfill, constraints.

-- 1) Nullable workspace columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "AIInsight" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "SeoProject" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "BusinessInfo" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- 2) Resolve workspace id for legacy rows
DO $$
DECLARE
  wid TEXT;
  uid TEXT;
BEGIN
  SELECT w.id INTO wid FROM "Workspace" w ORDER BY w."createdAt" ASC LIMIT 1;

  IF wid IS NULL THEN
    SELECT u.id INTO uid FROM "User" u ORDER BY u."createdAt" ASC LIMIT 1;
    IF uid IS NULL THEN
      INSERT INTO "User" ("id", "clerkId", "email", "name", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        'migration-placeholder',
        'migration-placeholder@local.invalid',
        'Migration',
        NOW(),
        NOW()
      )
      RETURNING id INTO uid;
    END IF;

    INSERT INTO "Workspace" ("id", "name", "ownerId", "createdAt")
    VALUES (gen_random_uuid()::text, 'Default workspace', uid, NOW())
    RETURNING id INTO wid;

    IF NOT EXISTS (
      SELECT 1 FROM "WorkspaceMembership" m WHERE m."userId" = uid AND m."workspaceId" = wid
    ) THEN
      INSERT INTO "WorkspaceMembership" ("id", "userId", "workspaceId", "role", "createdAt")
      VALUES (gen_random_uuid()::text, uid, wid, 'OWNER', NOW());
    END IF;
  END IF;

  UPDATE "Product" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "Customer" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "Order" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "Campaign" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "AIInsight" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "SeoProject" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
  UPDATE "BusinessInfo" SET "workspaceId" = wid WHERE "workspaceId" IS NULL;
END $$;

-- 3) BusinessInfo: replace singleton PK with per-workspace rows
CREATE TABLE "BusinessInfo_new" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInfo_new_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BusinessInfo_new" ("id", "workspaceId", "name", "industry", "description", "website", "currency", "updatedAt")
SELECT gen_random_uuid()::text, b."workspaceId", b."name", b."industry", b."description", b."website", b."currency", b."updatedAt"
FROM "BusinessInfo" b
WHERE b."workspaceId" IS NOT NULL;

DROP TABLE "BusinessInfo";
ALTER TABLE "BusinessInfo_new" RENAME TO "BusinessInfo";

-- 4) NOT NULL workspaceId
ALTER TABLE "Product" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Campaign" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AIInsight" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "SeoProject" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "BusinessInfo" ALTER COLUMN "workspaceId" SET NOT NULL;

-- 5) Drop old uniques / add composite uniques
DROP INDEX IF EXISTS "Product_sku_key";
CREATE UNIQUE INDEX "Product_workspaceId_sku_key" ON "Product"("workspaceId", "sku");

DROP INDEX IF EXISTS "Customer_email_key";
CREATE UNIQUE INDEX "Customer_workspaceId_email_key" ON "Customer"("workspaceId", "email");

DROP INDEX IF EXISTS "Order_orderNumber_key";
CREATE UNIQUE INDEX "Order_workspaceId_orderNumber_key" ON "Order"("workspaceId", "orderNumber");

CREATE UNIQUE INDEX "BusinessInfo_workspaceId_key" ON "BusinessInfo"("workspaceId");

-- 6) FKs to Workspace
ALTER TABLE "Product" ADD CONSTRAINT "Product_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeoProject" ADD CONSTRAINT "SeoProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessInfo" ADD CONSTRAINT "BusinessInfo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Product_workspaceId_idx" ON "Product"("workspaceId");
CREATE INDEX "Customer_workspaceId_idx" ON "Customer"("workspaceId");
CREATE INDEX "Order_workspaceId_idx" ON "Order"("workspaceId");
CREATE INDEX "Campaign_workspaceId_idx" ON "Campaign"("workspaceId");
CREATE INDEX "AIInsight_workspaceId_idx" ON "AIInsight"("workspaceId");
CREATE INDEX "SeoProject_workspaceId_idx" ON "SeoProject"("workspaceId");

/*
  Warnings:

  - Changed the type of `condition` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `condition` on the `trade_ins` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'A', 'B', 'C', 'F');

-- AlterTable
ALTER TABLE "brand_categories" ALTER COLUMN "images" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable (products.condition: migrate string values to enum)
-- Migrate products.condition
ALTER TABLE "products" ADD COLUMN "condition_new" "Condition";
UPDATE "products" SET "condition_new" = CASE
    WHEN LOWER("condition") IN ('pristine', 'excellent', 'mint') THEN 'A'::"Condition"
    WHEN LOWER("condition") IN ('very good', 'good')             THEN 'B'::"Condition"
    WHEN LOWER("condition") IN ('fair', 'damaged', 'used', 'refurbished') THEN 'C'::"Condition"
    ELSE 'B'::"Condition"
END;
ALTER TABLE "products" ALTER COLUMN "condition_new" SET NOT NULL;
ALTER TABLE "products" DROP COLUMN "condition";
ALTER TABLE "products" RENAME COLUMN "condition_new" TO "condition";

-- AlterTable
ALTER TABLE "promo_slides" ADD COLUMN     "layoutTheme" TEXT NOT NULL DEFAULT 'system',
ALTER COLUMN "title" SET DEFAULT '',
ALTER COLUMN "subtitle" SET DEFAULT '',
ALTER COLUMN "btnLink" SET DEFAULT '/';

-- AlterTable (trade_ins.condition: migrate string values to enum)
-- Migrate trade_ins.condition
ALTER TABLE "trade_ins" ADD COLUMN "condition_new" "Condition";
UPDATE "trade_ins" SET "condition_new" = CASE
    WHEN LOWER("condition") IN ('pristine', 'excellent', 'mint', 'a grade', 'a') THEN 'A'::"Condition"
    WHEN LOWER("condition") IN ('good', 'very good', 'used', 'mint', 'b grade', 'b') THEN 'B'::"Condition"
    WHEN LOWER("condition") IN ('damaged', 'fair', 'heavy wear', 'c grade', 'c') THEN 'C'::"Condition"
    WHEN LOWER("condition") IN ('non-working', 'broken', 'f grade', 'f') THEN 'F'::"Condition"
    ELSE 'B'::"Condition"
END;
ALTER TABLE "trade_ins" ALTER COLUMN "condition_new" SET NOT NULL;
ALTER TABLE "trade_ins" DROP COLUMN "condition";
ALTER TABLE "trade_ins" RENAME COLUMN "condition_new" TO "condition";

-- CreateIndex
CREATE INDEX "products_condition_idx" ON "products"("condition");

-- Remove old pricing config keys (new ones seeded by pricing-config service)
DELETE FROM "pricing_configs"
WHERE "key" IN ('multiplier_mint', 'multiplier_good', 'multiplier_used', 'multiplier_damaged');

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

-- AlterTable
ALTER TABLE "products" DROP COLUMN "condition",
ADD COLUMN     "condition" "Condition" NOT NULL;

-- AlterTable
ALTER TABLE "promo_slides" ADD COLUMN     "layoutTheme" TEXT NOT NULL DEFAULT 'system',
ALTER COLUMN "title" SET DEFAULT '',
ALTER COLUMN "subtitle" SET DEFAULT '',
ALTER COLUMN "btnLink" SET DEFAULT '/';

-- AlterTable
ALTER TABLE "trade_ins" DROP COLUMN "condition",
ADD COLUMN     "condition" "Condition" NOT NULL;

-- CreateIndex
CREATE INDEX "products_condition_idx" ON "products"("condition");

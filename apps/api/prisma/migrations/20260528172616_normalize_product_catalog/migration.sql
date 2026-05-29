-- Clear dependent data so the schema change runs on empty tables
TRUNCATE TABLE "order_items" CASCADE;
TRUNCATE TABLE "products" CASCADE;
TRUNCATE TABLE "device_catalog" CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "products_brand_idx";

-- DropIndex
DROP INDEX IF EXISTS "products_category_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "brand",
DROP COLUMN "category",
DROP COLUMN "model",
ADD COLUMN     "catalogId" TEXT NOT NULL,
ADD COLUMN     "storage" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "products_catalogId_idx" ON "products"("catalogId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "device_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

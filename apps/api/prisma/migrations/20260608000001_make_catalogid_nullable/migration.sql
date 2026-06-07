-- AlterTable: make catalogId nullable so "others" products (accessories,
-- games, etc.) can be created without a device catalog entry.
ALTER TABLE "products" ALTER COLUMN "catalogId" DROP NOT NULL;

-- Also drop the FK constraint that enforces referential integrity on catalogId,
-- since NULL values are now allowed (others products have no catalog entry).
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_catalogId_fkey";

-- Re-add FK with ON DELETE SET NULL so it still enforces valid IDs when present.
ALTER TABLE "products"
    ADD CONSTRAINT "products_catalogId_fkey"
    FOREIGN KEY ("catalogId") REFERENCES "device_catalog"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

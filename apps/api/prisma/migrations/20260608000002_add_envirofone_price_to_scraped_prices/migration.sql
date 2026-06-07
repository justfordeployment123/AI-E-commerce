-- AlterTable: add envirofonePrice column to scraped_prices (was in schema but never migrated)
ALTER TABLE "scraped_prices" ADD COLUMN IF NOT EXISTS "envirofonePrice" DOUBLE PRECISION;

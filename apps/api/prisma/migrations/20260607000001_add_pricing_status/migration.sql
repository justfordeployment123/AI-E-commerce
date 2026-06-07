-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pricingStatus" TEXT NOT NULL DEFAULT 'no_data';

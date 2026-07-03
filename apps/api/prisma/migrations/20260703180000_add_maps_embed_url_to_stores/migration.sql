-- AlterTable: Add mapsEmbedUrl to stores for precise Google Maps embed per store
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "mapsEmbedUrl" TEXT;

-- Add missing columns to promo_slides
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "tabTitle"    TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "tag"         TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "titleLine1"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "titleLine2"  TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "titleItalic" TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "badgeA"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "badgeB"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "specs"       TEXT NOT NULL DEFAULT '';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "themeColor"  TEXT NOT NULL DEFAULT 'from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400';
ALTER TABLE "promo_slides" ADD COLUMN IF NOT EXISTS "bgGlow"      TEXT NOT NULL DEFAULT 'rgba(59,130,246,0.15)';

-- Add missing columns to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isSellable"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "isRepairable" BOOLEAN NOT NULL DEFAULT false;

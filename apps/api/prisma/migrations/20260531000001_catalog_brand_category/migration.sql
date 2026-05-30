-- Migration: catalog-brand-category
-- Adds Category, Brand, BrandCategory tables and migrates DeviceCatalog
-- to use brandCategoryId FK instead of hardcoded brand/category strings.
--
-- Strategy: seed lookup tables first, populate the FK column, then drop
-- the old columns — so no data is ever left orphaned.
--
-- Note: existing device_catalog.category values are lowercase slugs
-- (e.g. "phones", "tablets", "accessories") — matched via category.slug.

-- ─── 1. Create lookup tables ─────────────────────────────────────────────────

-- CreateTable: categories
CREATE TABLE "categories" (
    "id"          TEXT        NOT NULL,
    "name"        TEXT        NOT NULL,
    "slug"        TEXT        NOT NULL,
    "description" TEXT,
    "image"       TEXT,
    "isActive"    BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: brands
CREATE TABLE "brands" (
    "id"        TEXT        NOT NULL,
    "name"      TEXT        NOT NULL,
    "slug"      TEXT        NOT NULL,
    "logo"      TEXT,
    "isActive"  BOOLEAN     NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable: brand_categories
CREATE TABLE "brand_categories" (
    "id"         TEXT        NOT NULL,
    "brandId"    TEXT        NOT NULL,
    "categoryId" TEXT        NOT NULL,
    "images"     TEXT[]      NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive"   BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_categories_pkey" PRIMARY KEY ("id")
);

-- ─── 2. Unique indexes on lookup tables ──────────────────────────────────────

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

CREATE UNIQUE INDEX "brand_categories_brandId_categoryId_key"
    ON "brand_categories"("brandId", "categoryId");

-- ─── 3. Foreign keys on brand_categories ─────────────────────────────────────

ALTER TABLE "brand_categories"
    ADD CONSTRAINT "brand_categories_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "brands"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "brand_categories"
    ADD CONSTRAINT "brand_categories_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── 4. Seed categories ───────────────────────────────────────────────────────
-- Known taxonomy. "Accessories" included because existing device_catalog rows
-- use that category value. Slugs match the lowercase strings already in the DB.

INSERT INTO "categories" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'Phones',      'phones',      now(), now()),
    (gen_random_uuid(), 'Tablets',     'tablets',     now(), now()),
    (gen_random_uuid(), 'Laptops',     'laptops',     now(), now()),
    (gen_random_uuid(), 'Consoles',    'consoles',    now(), now()),
    (gen_random_uuid(), 'Audio',       'audio',       now(), now()),
    (gen_random_uuid(), 'Accessories', 'accessories', now(), now());

-- ─── 5. Seed brands from existing device_catalog rows ────────────────────────

INSERT INTO "brands" ("id", "name", "slug", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    brand,
    lower(replace(brand, ' ', '-')),
    now(),
    now()
FROM (SELECT DISTINCT brand FROM "device_catalog") AS t;

-- ─── 6. Seed brand_categories from unique (brand, category) pairs ─────────────
-- Matches via category.slug because device_catalog.category stores lowercase
-- slug-style values (e.g. "phones", not "Phones").

INSERT INTO "brand_categories" ("id", "brandId", "categoryId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    b.id,
    c.id,
    now(),
    now()
FROM (SELECT DISTINCT brand, category FROM "device_catalog") AS dc
JOIN "brands"     b ON b.name = dc.brand
JOIN "categories" c ON c.slug = dc.category;

-- ─── 7. Add brandCategoryId column (nullable first so UPDATE can populate it) ─

ALTER TABLE "device_catalog" ADD COLUMN "brandCategoryId" TEXT;

-- ─── 8. Populate brandCategoryId from the join tables ─────────────────────────
-- Matches via brand.name and category.slug (data stores lowercase slugs).

UPDATE "device_catalog" dc
SET "brandCategoryId" = bc.id
FROM "brands"           b
JOIN "brand_categories" bc ON bc."brandId"    = b.id
JOIN "categories"       c  ON c.id            = bc."categoryId"
WHERE b.name   = dc.brand
  AND c.slug   = dc.category;

-- ─── 9. Make brandCategoryId NOT NULL now that every row is populated ──────────

ALTER TABLE "device_catalog"
    ALTER COLUMN "brandCategoryId" SET NOT NULL;

-- ─── 10. Drop old columns and unique constraint ────────────────────────────────

DROP INDEX "device_catalog_brand_model_key";

ALTER TABLE "device_catalog"
    DROP COLUMN "brand",
    DROP COLUMN "category";

-- ─── 11. Add new unique constraint and index ──────────────────────────────────

CREATE UNIQUE INDEX "device_catalog_brandCategoryId_model_key"
    ON "device_catalog"("brandCategoryId", "model");

CREATE INDEX "device_catalog_brandCategoryId_idx"
    ON "device_catalog"("brandCategoryId");

-- ─── 12. Foreign key from device_catalog to brand_categories ─────────────────

ALTER TABLE "device_catalog"
    ADD CONSTRAINT "device_catalog_brandCategoryId_fkey"
    FOREIGN KEY ("brandCategoryId") REFERENCES "brand_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

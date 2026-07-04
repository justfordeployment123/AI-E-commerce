-- Drop slug column from categories — name is now the unique identifier,
-- and URL keys are derived from name.toLowerCase() at runtime
ALTER TABLE "categories" DROP COLUMN IF EXISTS "slug";

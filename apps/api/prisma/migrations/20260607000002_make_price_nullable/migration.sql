-- AlterTable: make product price nullable to support "price on request" products
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

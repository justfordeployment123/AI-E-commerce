-- CreateTable
CREATE TABLE "other_brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "other_subcategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "other_subcategories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "products" ADD COLUMN "otherBrandId" TEXT;
ALTER TABLE "products" ADD COLUMN "otherSubcategoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "other_brands_name_key" ON "other_brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "other_subcategories_name_key" ON "other_subcategories"("name");

-- CreateIndex
CREATE INDEX "products_otherBrandId_idx" ON "products"("otherBrandId");

-- CreateIndex
CREATE INDEX "products_otherSubcategoryId_idx" ON "products"("otherSubcategoryId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_otherBrandId_fkey" FOREIGN KEY ("otherBrandId") REFERENCES "other_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_otherSubcategoryId_fkey" FOREIGN KEY ("otherSubcategoryId") REFERENCES "other_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

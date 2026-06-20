-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "device_catalog" ADD COLUMN     "manualMarketPrice" DOUBLE PRECISION,
ADD COLUMN     "tradeInEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundId" TEXT;

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "stores" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "address"      TEXT NOT NULL,
  "city"         TEXT NOT NULL,
  "postcode"     TEXT NOT NULL,
  "phone"        TEXT,
  "openingHours" TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "trade_ins" ADD COLUMN "storeId" TEXT;

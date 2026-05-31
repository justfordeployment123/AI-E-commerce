CREATE TABLE "promo_slides" (
    "id"        TEXT NOT NULL,
    "imgKey"    TEXT,
    "title"     TEXT NOT NULL,
    "subtitle"  TEXT NOT NULL,
    "btnText"   TEXT NOT NULL DEFAULT 'Shop Now',
    "btnLink"   TEXT NOT NULL,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_slides_pkey" PRIMARY KEY ("id")
);

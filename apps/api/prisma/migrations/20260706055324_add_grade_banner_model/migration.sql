CREATE TABLE "grade_banners" (
    "id"        TEXT NOT NULL,
    "grade"     TEXT NOT NULL,
    "key"       TEXT NOT NULL,
    "label"     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_banners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grade_banners_key_key" ON "grade_banners"("key");

CREATE INDEX "grade_banners_grade_idx" ON "grade_banners"("grade");

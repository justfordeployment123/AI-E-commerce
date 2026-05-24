-- Add images array to trade_ins and repairs tables
ALTER TABLE "trade_ins" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "repairs" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

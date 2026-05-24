-- Performance indexes for frequently filtered/sorted columns

-- users: sort by createdAt
CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- products: filter by category, brand, condition; sort by isActive+createdAt
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products"("brand");
CREATE INDEX IF NOT EXISTS "products_condition_idx" ON "products"("condition");
CREATE INDEX IF NOT EXISTS "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- orders: filter by userId, status; sort by createdAt
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "orders"("createdAt");

-- trade_ins: filter by status, userId; sort by createdAt
CREATE INDEX IF NOT EXISTS "trade_ins_status_idx" ON "trade_ins"("status");
CREATE INDEX IF NOT EXISTS "trade_ins_userId_idx" ON "trade_ins"("userId");
CREATE INDEX IF NOT EXISTS "trade_ins_createdAt_idx" ON "trade_ins"("createdAt");

-- repairs: filter by status, userId; sort by createdAt
CREATE INDEX IF NOT EXISTS "repairs_status_idx" ON "repairs"("status");
CREATE INDEX IF NOT EXISTS "repairs_userId_idx" ON "repairs"("userId");
CREATE INDEX IF NOT EXISTS "repairs_createdAt_idx" ON "repairs"("createdAt");

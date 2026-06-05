# Product Pricing Engine — Design Spec
**Date:** 2026-06-05  
**Status:** Approved  
**Scope:** Product auto-pricing, admin pricing UI, auto-enable/disable, trade-in AI improvements

---

## 1. Problem Statement

The store has three data sources — scraped competitor prices, an AI model, and admin manual input — but no unified engine to turn them into consistent product prices. Products currently have no safety gate preventing zero-price items from going live, trade-in offers vary on repeated submissions of the same device, and admins have no visibility into competitor pricing when setting prices manually.

---

## 2. Goals

- Automatically price catalog products after every scraper run using a deterministic formula
- Validate every computed price against an AI-generated expected range before applying
- Give admins full pricing context (scraped prices + AI range) when editing any product
- Block unpriced or imageless products from going live; show "Out of Stock" for zero-stock products
- Make trade-in offers fully deterministic: same device + condition = same offer every time
- Add `tradein_ratio` as a configurable margin control

---

## 3. Pricing Formula

### Resale product price
```
conditionMultiplier = pricingConfig[condition]   // mint=1.0, good=0.82, used=0.62, damaged=0.3
candidatePrice      = round5( marketPrice × conditionMultiplier × (1 − margin_pct / 100) )
round5(x)           = Math.max( Math.round(x / 5) * 5, 10 )
```

### AI range check
The AI receives: `brand`, `model`, `storage`, `condition`, `marketPrice`, `candidatePrice`.  
Returns: `{ low: number, high: number }`.  
- `candidatePrice` within `[low, high]` → **auto-apply**
- `candidatePrice` outside range → **flagged**, price not set, product stays disabled

### Trade-in offer (deterministic)
```
Priority 1 — catalog anchor:
  offer = round5( productResalePrice × tradein_ratio )

Priority 2 — scraped anchor:
  offer = round5( marketPrice × conditionMultiplier × (1 − margin_pct/100) × tradein_ratio )

Priority 3 — AI with full context (only when no scraped data AND no catalog price):
  AI receives: all scraped prices, store resale price, margin_pct, tradein_ratio, condition multipliers
  AI instruction: deterministic, no variance, return single { price: number }
```

**`tradein_ratio`** — new `PricingConfig` key, default `0.50`.

---

## 4. Condition Mapping

| Product condition | Trade-in condition | Multiplier |
|---|---|---|
| Pristine | Mint | 1.0 |
| Excellent | Mint | 1.0 |
| Very Good | Good | 0.82 |
| Good | Good | 0.82 |
| Fair | Used | 0.62 |

---

## 5. Backend Architecture

### New module
```
apps/api/src/modules/product-pricing/
  product-pricing.service.ts
  product-pricing.module.ts
  product-pricing.controller.ts
  dto/price-estimate.dto.ts
```

### `ProductPricingService` — public interface
```typescript
priceCatalog(): Promise<PricingRunResult>
// Runs full pricing pass for all active catalog products.
// Called by: ScraperCronService (auto, after every run), admin endpoint (manual).
// PricingRunResult: { applied: number, flagged: number, skipped: number, details: PricingDetail[] }

priceProduct(productId: string): Promise<PricingDetail>
// Prices a single product. Called on product create/edit save.
// PricingDetail: { productId, status: 'applied'|'flagged'|'no_data', candidatePrice?, aiRange?, reason? }

getEstimate(brand, model, storage, condition): Promise<{ low: number, high: number, marketPrice: number | null }>
// Returns AI range + scraped market price for the admin UI hint panel.

getTradeInAnchor(brand, model, storage, condition): Promise<number | null>
// Returns deterministic trade-in offer. Used by TradeInsService.
```

### New admin REST endpoints
All guarded by `JwtAuthGuard + ADMIN`:
```
POST /product-pricing/run           → priceCatalog()
POST /product-pricing/product/:id   → priceProduct(id)
GET  /product-pricing/estimate      → ?brand=&model=&storage=&condition=
GET  /product-pricing/flagged       → products with pricingStatus='flagged'
```

### Wiring changes to existing files

| File | Change |
|---|---|
| `ScraperCronService` | After firing scraper run, call `priceCatalog()` async (fire-and-forget) |
| `ProductsController PATCH /:id` | After save, call `priceProduct(id)`, apply `evaluateActive()` |
| `ProductsController POST /` | After create, call `priceProduct(id)`, apply `evaluateActive()` |
| `TradeInsService.aiPrice()` | Replace priority chain with new deterministic flow using `getTradeInAnchor()` |
| `PricingConfigService` | Seed `tradein_ratio = 0.50` in DEFAULTS |

### Dependencies injected into `ProductPricingService`
`PrismaService` (global), `ScraperDataService`, `PricingConfigService`, OpenAI client (same pattern as `TradeInsService`)

---

## 6. Database Migration

One new column on `Product`:
```prisma
pricingStatus  String  @default("no_data")
// "auto_priced" | "manual" | "flagged" | "no_data"
```

Migration: `prisma migrate dev --name add_pricing_status`

---

## 7. Auto-enable / Disable Rule

### `evaluateActive()` — pure function, used in all write paths
```typescript
function evaluateActive(price: number, images: string[], pricingStatus: string): boolean {
  return price > 0 && images.length >= 1 && pricingStatus !== 'flagged';
}
```

### Trigger points

| Event | Action |
|---|---|
| `priceProduct()` auto-applies price | Set price, `pricingStatus='auto_priced'`, re-run `evaluateActive()` |
| `priceProduct()` flags product | Set `pricingStatus='flagged'`, force `isActive=false` |
| Admin saves price manually | Set `pricingStatus='manual'`, re-run `evaluateActive()` |
| Admin uploads first image | Re-run `evaluateActive()` — auto-enables if price already set |
| Admin toggles isActive manually | Backend rejects with `400` if `price=0` or `images=[]` |

### Web storefront
- Products with `isActive=false` excluded from listings (existing behaviour, no change)
- Products with `stock=0` shown with **"Out of Stock"** badge — still visible in listings

---

## 8. Product Admin UI

### Products list page additions
- **"Auto-price All"** button in header → `POST /product-pricing/run` → result toast
- **"Flagged"** filter tab → shows `pricingStatus='flagged'` products
- Per-row: **enable/disable toggle** (locked disabled when `price=0` or `images=[]`)
- Per-row status badge: `Auto-priced` (blue) | `Manual` (zinc) | `Flagged ⚠` (amber) | `No data` (red)
- Per-row stock badge: `Out of Stock` (orange) when `stock=0`

### Product edit/create modal — Pricing Panel

**For catalog products (catalogId set):**
1. Competitor prices table (read-only, from scraper): CeX Sell | CeX Cash | Envirofone | Market Best
2. AI estimate range bar: `£low — £high`, suggested price
3. "Auto-fill £X" button → populates price field
4. Price / compare-price inputs
5. Inline feedback: green ✓ if within range, amber ⚠ if outside (save still allowed — admin override)
6. "Auto-price this product" button → `POST /product-pricing/product/:id`

**For other-brand products (no catalogId):**
1. No competitor table (no scraped data)
2. AI estimate range only (AI uses brand/model/condition text)
3. Price input with range hint

---

## 9. Trade-in AI Improvements

### Updated `aiPrice()` flow in `TradeInsService`

```
1. getTradeInAnchor(brand, model, storage, matchedCondition)
   → if returns number: return { price, source: 'catalog'|'scraped', aiUsed: false }

2. AI fallback (only when anchor = null):
   System prompt includes:
     - All scraped competitor prices (CeX, Envirofone, etc.)
     - Store resale price for this device (if set in catalog)
     - margin_pct, tradein_ratio, conditionMultipliers from config
   Instruction: "Return single JSON { price: number }. Be deterministic."
   → return { price, source: 'ai', aiUsed: true }
```

### Response shape change
Add `source: 'catalog' | 'scraped' | 'ai'` to `aiPrice()` response. Admin trade-in detail view shows this as a badge.

---

## 10. Error Handling & Edge Cases

| Case | Handling |
|---|---|
| Scraper has no data for a product | `pricingStatus='no_data'`, product stays disabled, flagged in admin UI |
| OpenAI API down during range check | Log error, set `pricingStatus='flagged'` with reason `'ai_unavailable'`, admin resolves manually |
| Admin saves price outside AI range | Warning shown, save proceeds, `pricingStatus='manual'` |
| Product has no images at price-set time | Price saved but `isActive` stays false until image uploaded |
| `tradein_ratio` or `margin_pct` not in DB | Both have hard-coded defaults (`0.50`, `30`) as fallback |
| Same product traded in twice | Priority 1 (catalog price) is deterministic → identical offer guaranteed |

---

## 11. New Config Keys Summary

| Key | Default | Label |
|---|---|---|
| `tradein_ratio` | `0.50` | Trade-in offer ratio (% of resale price) |

All existing keys (`multiplier_mint`, `multiplier_good`, `multiplier_used`, `multiplier_damaged`, `margin_pct`, `scraper_schedule_hours`) unchanged.

---

## 12. Files Changed / Created

### New
- `apps/api/src/modules/product-pricing/product-pricing.service.ts`
- `apps/api/src/modules/product-pricing/product-pricing.module.ts`
- `apps/api/src/modules/product-pricing/product-pricing.controller.ts`
- `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts`
- `apps/api/prisma/migrations/YYYYMMDD_add_pricing_status/`

### Modified
- `apps/api/src/modules/scraper-cron/scraper-cron.service.ts`
- `apps/api/src/modules/products/products.controller.ts`
- `apps/api/src/modules/products/products.service.ts`
- `apps/api/src/modules/trade-ins/trade-ins.service.ts`
- `apps/api/src/modules/pricing-config/pricing-config.service.ts`
- `apps/api/src/app.module.ts`
- `apps/admin/app/products/page.tsx`
- `apps/admin/app/products/[id]/page.tsx` *(or modal component)*
- `apps/admin/lib/api.ts`
- `apps/web/app/(store)/products/page.tsx` *(Out of Stock badge)*
- `apps/web/components/ProductCard.tsx` *(or equivalent)*

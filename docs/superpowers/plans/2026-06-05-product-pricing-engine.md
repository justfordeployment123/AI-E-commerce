# Product Pricing Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic pricing engine that auto-prices catalog products from scraped data + AI validation, gates product activation on price + image, and makes trade-in offers fully deterministic.

**Architecture:** A new `ProductPricingModule` owns all pricing logic via `ProductPricingService`. It is called by `ScraperCronService` after every run, by `ProductsService` on every create/update, and by `TradeInsService` as the primary offer anchor. Admin UI surfaces scraped prices + AI range hints in the product edit modal. Activation is enforced server-side on every write path.

**Tech Stack:** NestJS, Prisma, OpenAI `gpt-4o` (`temperature: 0`, `response_format: json_object`), class-validator, Next.js + Tailwind (admin), Jest (unit tests)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `apps/api/src/modules/product-pricing/product-pricing.helpers.ts` | Pure formula functions — zero deps, fully testable |
| CREATE | `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts` | Unit tests for all helpers |
| CREATE | `apps/api/src/modules/product-pricing/product-pricing.service.ts` | Core engine: getEstimate, priceProduct, priceCatalog, getTradeInAnchor |
| CREATE | `apps/api/src/modules/product-pricing/product-pricing.module.ts` | NestJS module wiring |
| CREATE | `apps/api/src/modules/product-pricing/product-pricing.controller.ts` | REST endpoints for admin UI |
| CREATE | `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts` | Request DTO for estimate endpoint |
| MODIFY | `apps/api/prisma/schema.prisma` | Add `pricingStatus` field to Product |
| MODIFY | `apps/api/src/modules/pricing-config/pricing-config.service.ts` | Add `tradein_ratio` default |
| MODIFY | `apps/api/src/modules/products/products.service.ts` | Call evaluateActive on every write; set pricingStatus='manual' on price change |
| MODIFY | `apps/api/src/modules/products/products.controller.ts` | Reject isActive=true if gate not met |
| MODIFY | `apps/api/src/modules/trade-ins/trade-ins.service.ts` | Replace aiPrice() priority chain |
| MODIFY | `apps/api/src/modules/scraper-cron/scraper-cron.service.ts` | Call priceCatalog() after scraper run |
| MODIFY | `apps/api/src/app.module.ts` | Import ProductPricingModule |
| MODIFY | `apps/admin/lib/api.ts` | Add productPricingApi + pricingStatus to Product type |
| MODIFY | `apps/admin/app/products/page.tsx` | Badges, toggle, Auto-price All, Flagged filter, Pricing Panel in modal |
| MODIFY | `apps/web/app/shop/[category]/page.tsx` | Ensure Out of Stock badge is always visible (not greyed-out) |

---

## Task 1: Prisma migration — add pricingStatus to Product

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add field to Product model**

Open `apps/api/prisma/schema.prisma`. Find the `model Product` block and add after `isActive`:

```prisma
  pricingStatus       String    @default("no_data")
  // "auto_priced" | "manual" | "flagged" | "no_data"
```

- [ ] **Step 2: Run migration**

```bash
cd apps/api
npx prisma migrate dev --name add_product_pricing_status
```

Expected output: `✔ Generated Prisma Client`

- [ ] **Step 3: Verify**

```bash
npx prisma studio
```

Open Product table — confirm `pricingStatus` column exists with default `"no_data"`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): add pricingStatus to Product"
```

---

## Task 2: Add tradein_ratio to PricingConfig defaults

**Files:**
- Modify: `apps/api/src/modules/pricing-config/pricing-config.service.ts`

- [ ] **Step 1: Add to DEFAULTS array**

In `pricing-config.service.ts`, find the `DEFAULTS` array (around line 6) and add one entry:

```typescript
const DEFAULTS: { key: string; value: number; label: string }[] = [
    { key: 'multiplier_mint',    value: 1.0,  label: 'Mint condition multiplier' },
    { key: 'multiplier_good',    value: 0.82, label: 'Good condition multiplier' },
    { key: 'multiplier_used',    value: 0.62, label: 'Used condition multiplier' },
    { key: 'multiplier_damaged', value: 0.3,  label: 'Damaged condition multiplier' },
    { key: 'margin_pct',         value: 30,   label: 'Resale margin percentage' },
    { key: 'tradein_ratio',      value: 0.50, label: 'Trade-in offer ratio (% of resale price)' },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/pricing-config/pricing-config.service.ts
git commit -m "feat(pricing): add tradein_ratio default config"
```

---

## Task 3: Pure pricing helpers + unit tests

**Files:**
- Create: `apps/api/src/modules/product-pricing/product-pricing.helpers.ts`
- Create: `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts`

- [ ] **Step 1: Write failing tests first**

Create `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts`:

```typescript
import {
    round5,
    computeCandidatePrice,
    computeTradeInOffer,
    evaluateActive,
    conditionToMultiplierKey,
} from './product-pricing.helpers';

describe('round5', () => {
    it('rounds 347 down to 345', () => expect(round5(347)).toBe(345));
    it('rounds 343 up to 345', () => expect(round5(343)).toBe(345));
    it('enforces minimum of 10', () => expect(round5(3)).toBe(10));
    it('leaves exact multiples unchanged', () => expect(round5(350)).toBe(350));
    it('rounds 172.5 to 175', () => expect(round5(172.5)).toBe(175));
});

describe('computeCandidatePrice', () => {
    it('applies condition multiplier and margin: 600 * 0.82 * 0.70 = 344.4 → 345', () => {
        expect(computeCandidatePrice(600, 0.82, 30)).toBe(345);
    });
    it('mint at 30% margin: 600 * 1.0 * 0.70 = 420', () => {
        expect(computeCandidatePrice(600, 1.0, 30)).toBe(420);
    });
    it('damaged at 30% margin: 600 * 0.3 * 0.70 = 126 → 125', () => {
        expect(computeCandidatePrice(600, 0.3, 30)).toBe(125);
    });
});

describe('computeTradeInOffer', () => {
    it('345 * 0.50 = 172.5 → 175', () => expect(computeTradeInOffer(345, 0.5)).toBe(175));
    it('420 * 0.50 = 210', () => expect(computeTradeInOffer(420, 0.5)).toBe(210));
    it('enforces minimum of 10', () => expect(computeTradeInOffer(10, 0.1)).toBe(10));
});

describe('evaluateActive', () => {
    it('true when price > 0, image present, not flagged', () =>
        expect(evaluateActive(100, ['img.jpg'], 'auto_priced')).toBe(true));
    it('false when price is 0', () =>
        expect(evaluateActive(0, ['img.jpg'], 'auto_priced')).toBe(false));
    it('false when images empty', () =>
        expect(evaluateActive(100, [], 'auto_priced')).toBe(false));
    it('false when pricingStatus is flagged', () =>
        expect(evaluateActive(100, ['img.jpg'], 'flagged')).toBe(false));
    it('false when both price=0 and no images', () =>
        expect(evaluateActive(0, [], 'no_data')).toBe(false));
});

describe('conditionToMultiplierKey', () => {
    it('Pristine → multiplier_mint', () =>
        expect(conditionToMultiplierKey('Pristine')).toBe('multiplier_mint'));
    it('Excellent → multiplier_mint', () =>
        expect(conditionToMultiplierKey('Excellent')).toBe('multiplier_mint'));
    it('Very Good → multiplier_good', () =>
        expect(conditionToMultiplierKey('Very Good')).toBe('multiplier_good'));
    it('Good → multiplier_good', () =>
        expect(conditionToMultiplierKey('Good')).toBe('multiplier_good'));
    it('Fair → multiplier_used', () =>
        expect(conditionToMultiplierKey('Fair')).toBe('multiplier_used'));
    it('unknown → multiplier_used (safe fallback)', () =>
        expect(conditionToMultiplierKey('Unknown')).toBe('multiplier_used'));
});
```

- [ ] **Step 2: Run tests — confirm they all FAIL**

```bash
cd apps/api
npx jest product-pricing.helpers.spec.ts --no-coverage
```

Expected: `Cannot find module './product-pricing.helpers'`

- [ ] **Step 3: Create the helpers file**

Create `apps/api/src/modules/product-pricing/product-pricing.helpers.ts`:

```typescript
/**
 * All functions are pure (no I/O) — safe to unit-test without mocks.
 */

/** Rounds x to the nearest £5, with a minimum of £10. */
export function round5(x: number): number {
    return Math.max(Math.round(x / 5) * 5, 10);
}

/**
 * Computes the candidate resale price.
 * formula: marketPrice × conditionMultiplier × (1 - marginPct/100), rounded to £5
 */
export function computeCandidatePrice(
    marketPrice: number,
    conditionMultiplier: number,
    marginPct: number,
): number {
    return round5(marketPrice * conditionMultiplier * (1 - marginPct / 100));
}

/**
 * Computes the trade-in offer from a known resale price.
 * formula: resalePrice × tradeInRatio, rounded to £5
 */
export function computeTradeInOffer(resalePrice: number, tradeInRatio: number): number {
    return round5(resalePrice * tradeInRatio);
}

/**
 * Returns true only when ALL activation gates are met:
 *   - price > 0
 *   - at least one image
 *   - pricingStatus is not 'flagged'
 */
export function evaluateActive(price: number, images: string[], pricingStatus: string): boolean {
    return price > 0 && images.length >= 1 && pricingStatus !== 'flagged';
}

/**
 * Maps a product condition string to its PricingConfig multiplier key.
 * Product conditions: Pristine, Excellent, Very Good, Good, Fair
 */
export function conditionToMultiplierKey(condition: string): string {
    const c = condition.toLowerCase();
    if (c === 'pristine' || c === 'excellent') return 'multiplier_mint';
    if (c === 'very good' || c === 'good')     return 'multiplier_good';
    return 'multiplier_used'; // Fair, damaged, or unknown
}
```

- [ ] **Step 4: Run tests — confirm they all PASS**

```bash
npx jest product-pricing.helpers.spec.ts --no-coverage
```

Expected: `Tests: 14 passed, 14 total`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/product-pricing/
git commit -m "feat(pricing): add pure pricing helpers with tests"
```

---

## Task 4: ProductPricingService skeleton + module + app wiring

**Files:**
- Create: `apps/api/src/modules/product-pricing/product-pricing.service.ts` (skeleton)
- Create: `apps/api/src/modules/product-pricing/product-pricing.module.ts`
- Create: `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create DTO**

Create `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class PriceEstimateDto {
    @IsString() @IsNotEmpty() brand!: string;
    @IsString() @IsNotEmpty() model!: string;
    @IsString() storage!: string;
    @IsString() @IsNotEmpty() condition!: string;
}

export interface PricingDetail {
    productId: string;
    status: 'applied' | 'flagged' | 'no_data';
    candidatePrice?: number;
    aiRange?: { low: number; high: number };
    reason?: string;
}

export interface PricingRunResult {
    applied: number;
    flagged: number;
    skipped: number;
    details: PricingDetail[];
}

export interface ScrapedPricesSnapshot {
    cexSellPrice:      number | null;
    cexCashPrice:      number | null;
    cexExchangePrice:  number | null;
    envirofonePrice:   number | null;
    marketPrice:       number | null;
    scrapedAt:         string;
}

export interface EstimateResult {
    low:            number;
    high:           number;
    suggested:      number;
    marketPrice:    number | null;
    scrapedPrices:  ScrapedPricesSnapshot | null;
}
```

- [ ] **Step 2: Create service skeleton**

Create `apps/api/src/modules/product-pricing/product-pricing.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { ScraperDataService } from '../scraper-data/scraper-data.service';
import { PricingConfigService } from '../pricing-config/pricing-config.service';
import {
    round5,
    computeCandidatePrice,
    computeTradeInOffer,
    evaluateActive,
    conditionToMultiplierKey,
} from './product-pricing.helpers';
import type {
    PricingDetail,
    PricingRunResult,
    EstimateResult,
    ScrapedPricesSnapshot,
} from './dto/price-estimate.dto';

@Injectable()
export class ProductPricingService {
    private readonly logger = new Logger(ProductPricingService.name);
    private readonly openai: OpenAI;

    constructor(
        private readonly prisma:         PrismaService,
        private readonly scraperData:    ScraperDataService,
        private readonly pricingConfig:  PricingConfigService,
    ) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    // Implemented in subsequent tasks
    async getEstimate(_brand: string, _model: string, _storage: string, _condition: string): Promise<EstimateResult> {
        throw new Error('Not implemented');
    }

    async priceProduct(_productId: string): Promise<PricingDetail> {
        throw new Error('Not implemented');
    }

    async priceCatalog(): Promise<PricingRunResult> {
        throw new Error('Not implemented');
    }

    async getTradeInAnchor(_brand: string, _model: string, _storage: string, _condition: string): Promise<number | null> {
        throw new Error('Not implemented');
    }

    // ── Private helpers ──────────────────────────────────────────────────────────

    protected async getAllConfigs(): Promise<Record<string, number>> {
        const rows = await this.pricingConfig.findAll();
        return Object.fromEntries(rows.map(r => [r.key, r.value]));
    }

    protected async getScrapedSnapshot(
        brand: string, model: string, storage: string,
    ): Promise<ScrapedPricesSnapshot | null> {
        const rows = await this.scraperData.getDevicePrices(brand, model);
        const row  = rows.find(r => r.storage?.toLowerCase() === storage?.toLowerCase()) ?? rows[0] ?? null;
        if (!row) return null;
        return {
            cexSellPrice:     row.cexSellPrice     ?? null,
            cexCashPrice:     row.cexCashPrice      ?? null,
            cexExchangePrice: row.cexExchangePrice  ?? null,
            envirofonePrice:  row.envirofonePrice   ?? null,
            marketPrice:      row.marketPrice       ?? null,
            scrapedAt:        row.scrapedAt as unknown as string,
        };
    }

    protected async getAiRange(
        brand: string, model: string, storage: string, condition: string,
        marketPrice: number | null, candidatePrice: number | null,
    ): Promise<{ low: number; high: number }> {
        try {
            const prompt = [
                `Device: ${[brand, model, storage].filter(Boolean).join(' ')}`,
                `Condition: ${condition}`,
                marketPrice    ? `Competitor market price: £${marketPrice}`    : 'No competitor price available.',
                candidatePrice ? `Proposed store price: £${candidatePrice}` : '',
                '',
                'Return JSON only: {"low": number, "high": number}',
                'These are the expected resale price bounds in GBP for this exact device and condition at a UK second-hand store.',
            ].filter(Boolean).join('\n');

            const response = await this.openai.chat.completions.create({
                model:           'gpt-4o',
                temperature:     0,
                max_tokens:      60,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: 'You are a UK mobile phone resale pricing expert. Return valid JSON only. No markdown, no explanation.',
                    },
                    { role: 'user', content: prompt },
                ],
            });

            const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}') as {
                low?: number; high?: number;
            };
            if (typeof parsed.low === 'number' && typeof parsed.high === 'number') {
                return { low: round5(parsed.low), high: round5(parsed.high) };
            }
        } catch (err: any) {
            this.logger.warn(`AI range check failed for ${brand} ${model}: ${err.message}`);
        }
        // Fallback: ±25% around the candidate/market price
        const base = candidatePrice ?? (marketPrice ? round5(marketPrice * 0.7) : 50);
        return { low: round5(base * 0.75), high: round5(base * 1.25) };
    }
}
```

- [ ] **Step 3: Create module**

Create `apps/api/src/modules/product-pricing/product-pricing.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ProductPricingService }    from './product-pricing.service';
import { ProductPricingController } from './product-pricing.controller';
import { ScraperDataModule }        from '../scraper-data/scraper-data.module';
import { PricingConfigModule }      from '../pricing-config/pricing-config.module';

@Module({
    imports:     [ScraperDataModule, PricingConfigModule],
    providers:   [ProductPricingService],
    controllers: [ProductPricingController],
    exports:     [ProductPricingService],
})
export class ProductPricingModule {}
```

- [ ] **Step 4: Create controller stub** (full implementation in Task 9)

Create `apps/api/src/modules/product-pricing/product-pricing.controller.ts`:

```typescript
import { Controller } from '@nestjs/common';
import { ProductPricingService } from './product-pricing.service';

@Controller('product-pricing')
export class ProductPricingController {
    constructor(private readonly service: ProductPricingService) {}
}
```

- [ ] **Step 5: Register in AppModule**

In `apps/api/src/app.module.ts`, add the import:

```typescript
import { ProductPricingModule } from './modules/product-pricing/product-pricing.module';
```

Add `ProductPricingModule` to the `imports` array (alongside `ProductsModule`).

- [ ] **Step 6: Verify compilation**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/product-pricing/ apps/api/src/app.module.ts
git commit -m "feat(pricing): scaffold ProductPricingModule skeleton"
```

---

## Task 5: Implement getEstimate()

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.service.ts`

- [ ] **Step 1: Replace getEstimate() stub**

Replace the `getEstimate` method body:

```typescript
async getEstimate(
    brand: string, model: string, storage: string, condition: string,
): Promise<EstimateResult> {
    const configs           = await this.getAllConfigs();
    const multiplierKey     = conditionToMultiplierKey(condition);
    const conditionMult     = configs[multiplierKey]  ?? 0.82;
    const marginPct         = configs['margin_pct']   ?? 30;

    const scrapedPrices     = await this.getScrapedSnapshot(brand, model, storage);
    const marketPrice       = scrapedPrices?.marketPrice ?? null;

    const candidatePrice    = marketPrice
        ? computeCandidatePrice(marketPrice, conditionMult, marginPct)
        : null;

    const aiRange           = await this.getAiRange(brand, model, storage, condition, marketPrice, candidatePrice);

    const suggested         = candidatePrice ?? round5((aiRange.low + aiRange.high) / 2);

    return { ...aiRange, suggested, marketPrice, scrapedPrices };
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.service.ts
git commit -m "feat(pricing): implement getEstimate()"
```

---

## Task 6: Implement priceProduct()

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.service.ts`

- [ ] **Step 1: Replace priceProduct() stub**

```typescript
async priceProduct(productId: string): Promise<PricingDetail> {
    const product = await this.prisma.product.findUnique({
        where:   { id: productId },
        include: {
            catalog: {
                include: { brandCategory: { include: { brand: true } } },
            },
        },
    });

    if (!product) {
        return { productId, status: 'no_data', reason: 'product_not_found' };
    }

    // Only auto-price catalog products (non-catalog = manual only)
    if (!product.catalogId || !product.catalog) {
        return { productId, status: 'no_data', reason: 'no_catalog_link' };
    }

    const brand   = product.catalog.brandCategory.brand.name;
    const model   = product.catalog.model;
    const storage = product.storage ?? '';

    const marketPrice = await this.scraperData.lookupPrice(brand, model, storage);

    if (!marketPrice) {
        await this.prisma.product.update({
            where: { id: productId },
            data:  { pricingStatus: 'no_data', isActive: false },
        });
        return { productId, status: 'no_data', reason: 'no_scraped_price' };
    }

    const configs        = await this.getAllConfigs();
    const multiplierKey  = conditionToMultiplierKey(product.condition);
    const conditionMult  = configs[multiplierKey] ?? 0.82;
    const marginPct      = configs['margin_pct']  ?? 30;

    const candidatePrice = computeCandidatePrice(marketPrice, conditionMult, marginPct);
    const aiRange        = await this.getAiRange(brand, model, storage, product.condition, marketPrice, candidatePrice);

    const withinRange = candidatePrice >= aiRange.low && candidatePrice <= aiRange.high;

    if (!withinRange) {
        await this.prisma.product.update({
            where: { id: productId },
            data:  { pricingStatus: 'flagged', isActive: false },
        });
        this.logger.warn(
            `${brand} ${model} ${storage} flagged: candidate £${candidatePrice} outside AI range £${aiRange.low}–£${aiRange.high}`,
        );
        return { productId, status: 'flagged', candidatePrice, aiRange, reason: 'outside_ai_range' };
    }

    const images   = product.images as string[];
    const isActive = evaluateActive(candidatePrice, images, 'auto_priced');

    await this.prisma.product.update({
        where: { id: productId },
        data:  { price: candidatePrice, pricingStatus: 'auto_priced', isActive },
    });

    this.logger.log(`Priced ${brand} ${model} ${storage}: £${candidatePrice} (active: ${isActive})`);
    return { productId, status: 'applied', candidatePrice, aiRange };
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.service.ts
git commit -m "feat(pricing): implement priceProduct()"
```

---

## Task 7: Implement priceCatalog()

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.service.ts`

- [ ] **Step 1: Replace priceCatalog() stub**

```typescript
async priceCatalog(): Promise<PricingRunResult> {
    this.logger.log('Starting catalog pricing run…');

    // Target: all catalog products (active OR unpriced inactive)
    const products = await this.prisma.product.findMany({
        where: {
            catalogId: { not: null },
            OR: [
                { isActive: true },
                { price: 0 },
                { pricingStatus: { in: ['no_data', 'flagged'] } },
            ],
        },
        select: { id: true },
    });

    const details: PricingDetail[] = [];

    for (const { id } of products) {
        const detail = await this.priceProduct(id);
        details.push(detail);
        // Throttle to avoid OpenAI rate limits
        await new Promise(r => setTimeout(r, 250));
    }

    const result: PricingRunResult = {
        applied: details.filter(d => d.status === 'applied').length,
        flagged: details.filter(d => d.status === 'flagged').length,
        skipped: details.filter(d => d.status === 'no_data').length,
        details,
    };

    this.logger.log(
        `Pricing run complete: ${result.applied} applied, ${result.flagged} flagged, ${result.skipped} skipped`,
    );
    return result;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.service.ts
git commit -m "feat(pricing): implement priceCatalog()"
```

---

## Task 8: Implement getTradeInAnchor()

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.service.ts`

- [ ] **Step 1: Replace getTradeInAnchor() stub**

```typescript
async getTradeInAnchor(
    brand: string, model: string, storage: string, condition: string,
): Promise<number | null> {
    const configs        = await this.getAllConfigs();
    const tradeInRatio   = configs['tradein_ratio'] ?? 0.5;
    const multiplierKey  = conditionToMultiplierKey(condition);
    const conditionMult  = configs[multiplierKey]  ?? 0.82;
    const marginPct      = configs['margin_pct']   ?? 30;

    // Priority 1: use the actual product resale price from the catalog
    const product = await this.prisma.product.findFirst({
        where: {
            catalog: {
                brandCategory: { brand: { name: { equals: brand,   mode: 'insensitive' } } },
                model:                          { equals: model,   mode: 'insensitive' },
            },
            storage:       { equals: storage,   mode: 'insensitive' },
            condition:     { equals: condition, mode: 'insensitive' },
            price:         { gt: 0 },
            pricingStatus: { not: 'flagged' },
        },
        orderBy: { updatedAt: 'desc' },
        select:  { price: true },
    });

    if (product) {
        const offer = computeTradeInOffer(product.price, tradeInRatio);
        this.logger.log(`Trade-in anchor from catalog: £${product.price} × ${tradeInRatio} = £${offer}`);
        return offer;
    }

    // Priority 2: derive from scraped market price
    const marketPrice = await this.scraperData.lookupPrice(brand, model, storage);
    if (marketPrice) {
        const resalePrice = computeCandidatePrice(marketPrice, conditionMult, marginPct);
        const offer       = computeTradeInOffer(resalePrice, tradeInRatio);
        this.logger.log(`Trade-in anchor from scraped: market £${marketPrice} → resale £${resalePrice} × ${tradeInRatio} = £${offer}`);
        return offer;
    }

    return null; // Falls back to AI in TradeInsService
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.service.ts
git commit -m "feat(pricing): implement getTradeInAnchor()"
```

---

## Task 9: ProductPricingController — REST endpoints

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.controller.ts`

- [ ] **Step 1: Replace controller stub with full implementation**

```typescript
import {
    Controller, Get, Post, Param, Query, HttpCode, HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ProductPricingService }  from './product-pricing.service';
import { PriceEstimateDto }       from './dto/price-estimate.dto';
import { JwtAuthGuard }           from '../../common/guards/jwt-auth.guard';
import { RolesGuard }             from '../../common/guards/roles.guard';
import { Roles }                  from '../../common/decorators/roles.decorator';
import { Query as QueryDec }      from '@nestjs/common';

@Controller('product-pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ProductPricingController {
    constructor(private readonly service: ProductPricingService) {}

    /** Trigger full catalog pricing run (called by admin "Auto-price All" button) */
    @Post('run')
    @HttpCode(HttpStatus.OK)
    run() {
        return this.service.priceCatalog();
    }

    /** Price a single product by id */
    @Post('product/:id')
    @HttpCode(HttpStatus.OK)
    priceOne(@Param('id') id: string) {
        return this.service.priceProduct(id);
    }

    /** Get AI estimate range + scraped prices for the admin pricing panel */
    @Get('estimate')
    estimate(
        @QueryDec('brand')     brand:     string,
        @QueryDec('model')     model:     string,
        @QueryDec('storage')   storage:   string,
        @QueryDec('condition') condition: string,
    ) {
        return this.service.getEstimate(
            brand    ?? '',
            model    ?? '',
            storage  ?? '',
            condition ?? 'Good',
        );
    }

    /** List products flagged for manual review */
    @Get('flagged')
    flagged() {
        return this.service['prisma'].product.findMany({
            where:   { pricingStatus: 'flagged' },
            select:  { id: true, name: true, condition: true, storage: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.controller.ts
git commit -m "feat(pricing): add ProductPricingController endpoints"
```

---

## Task 10: Wire ScraperCronService to trigger pricing after each run

**Files:**
- Modify: `apps/api/src/modules/scraper-cron/scraper-cron.service.ts`
- Modify: `apps/api/src/modules/scraper-cron/scraper-cron.module.ts`

- [ ] **Step 1: Import ProductPricingModule in ScraperCronModule**

In `scraper-cron.module.ts`:

```typescript
import { Module }                from '@nestjs/common';
import { ScraperCronService }    from './scraper-cron.service';
import { ProductPricingModule }  from '../product-pricing/product-pricing.module';

@Module({
    imports:   [ProductPricingModule],
    providers: [ScraperCronService],
    exports:   [ScraperCronService],
})
export class ScraperCronModule {}
```

- [ ] **Step 2: Inject ProductPricingService and fire after scraper run**

In `scraper-cron.service.ts`, add the import and update the constructor and `startInterval`:

```typescript
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService }            from '../database/prisma.service';
import { ProductPricingService }    from '../product-pricing/product-pricing.service';

const CONFIG_KEY = 'scraper_schedule_hours';

@Injectable()
export class ScraperCronService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ScraperCronService.name);
    private currentHours = 1;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(
        private readonly prisma:          PrismaService,
        private readonly productPricing:  ProductPricingService,
    ) {}

    async onModuleInit() {
        const row = await this.prisma.pricingConfig
            .findUnique({ where: { key: CONFIG_KEY } })
            .catch(() => null);
        this.currentHours = row?.value ?? 1;
        if (this.currentHours > 0) this.startInterval(this.currentHours);
        this.logger.log(
            this.currentHours === 0
                ? 'Auto-scraper: disabled'
                : `Auto-scraper: every ${this.currentHours}h`,
        );
    }

    onModuleDestroy() { this.stopInterval(); }

    getSchedule(): { hours: number } { return { hours: this.currentHours }; }

    async setSchedule(hours: number): Promise<{ hours: number }> {
        const h = Math.floor(Number(hours));
        if (isNaN(h) || h < 0) throw new Error('Hours must be a non-negative integer.');
        await this.prisma.pricingConfig.upsert({
            where:  { key: CONFIG_KEY },
            update: { value: h, label: 'Scraper auto-run interval (hours, 0 = off)' },
            create: { key: CONFIG_KEY, value: h, label: 'Scraper auto-run interval (hours, 0 = off)' },
        });
        this.currentHours = h;
        this.stopInterval();
        if (h > 0) this.startInterval(h);
        this.logger.log(h === 0 ? 'Auto-scraper disabled.' : `Auto-scraper rescheduled: every ${h}h`);
        return { hours: h };
    }

    private startInterval(hours: number) {
        const ms = hours * 60 * 60 * 1000;
        this.intervalId = setInterval(async () => {
            const url = process.env.SCRAPER_URL || 'http://localhost:3003';
            this.logger.log('Auto-scraper fired — triggering scraper service…');
            try {
                await fetch(`${url}/scraper/run`, { method: 'POST' });
                // Wait a bit for the scraper to start writing data, then price
                await new Promise(r => setTimeout(r, 30_000));
                this.logger.log('Triggering auto-pricing after scraper run…');
                const result = await this.productPricing.priceCatalog();
                this.logger.log(
                    `Auto-pricing complete: ${result.applied} applied, ${result.flagged} flagged`,
                );
            } catch (err: any) {
                this.logger.error(`Auto-scraper/pricing cycle failed: ${err?.message}`);
            }
        }, ms);
        this.logger.log(`Interval registered: every ${hours}h`);
    }

    private stopInterval() {
        if (this.intervalId !== null) { clearInterval(this.intervalId); this.intervalId = null; }
    }
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/scraper-cron/
git commit -m "feat(pricing): wire priceCatalog() into ScraperCronService"
```

---

## Task 11: Wire ProductsService — enforce evaluateActive on every write

**Files:**
- Modify: `apps/api/src/modules/products/products.service.ts`
- Modify: `apps/api/src/modules/products/products.module.ts`
- Modify: `apps/api/src/modules/products/products.controller.ts`

- [ ] **Step 1: Import ProductPricingModule in ProductsModule**

Open `apps/api/src/modules/products/products.module.ts` and add:

```typescript
import { ProductPricingModule } from '../product-pricing/product-pricing.module';
```

Add `ProductPricingModule` to `imports: [ProductPricingModule]`.

- [ ] **Step 2: Inject ProductPricingService into ProductsService**

At the top of `products.service.ts`, add the import:

```typescript
import { ProductPricingService } from '../product-pricing/product-pricing.service';
import { evaluateActive }        from '../product-pricing/product-pricing.helpers';
```

Update the constructor:

```typescript
constructor(
    private readonly prisma:          PrismaService,
    private readonly storage:         StorageService,
    private readonly productPricing:  ProductPricingService,
) {}
```

- [ ] **Step 3: Add re-evaluation helper to ProductsService**

Add this private method at the end of `ProductsService` (before the closing `}`):

```typescript
/** Re-evaluates and persists isActive for a product after any write. */
private async revalidateActive(productId: string): Promise<void> {
    const p = await this.prisma.product.findUnique({
        where:  { id: productId },
        select: { price: true, images: true, pricingStatus: true },
    });
    if (!p) return;
    const active = evaluateActive(p.price, p.images as string[], p.pricingStatus as string);
    await this.prisma.product.update({ where: { id: productId }, data: { isActive: active } });
}
```

- [ ] **Step 4: Call revalidateActive after create**

In the `create()` method, replace the final `return this.presignAndFlatten(product)` with:

```typescript
// Auto-price catalog products; manual products start as no_data
if (product.catalogId) {
    // fire-and-forget — don't block the HTTP response
    this.productPricing.priceProduct(product.id).catch(err =>
        this.logger.error?.(`Auto-price on create failed: ${err.message}`) ?? null,
    );
} else {
    // Non-catalog: mark manual so admin knows to set price
    await this.prisma.product.update({
        where: { id: product.id },
        data:  { pricingStatus: 'no_data' },
    });
}
return this.presignAndFlatten(product);
```

Add `private readonly logger = new Logger(ProductsService.name);` at the top of the class if it doesn't already exist.

- [ ] **Step 5: Update update() to enforce gate on isActive + set pricingStatus on price change**

Replace the current `update()` method:

```typescript
async update(id: string, dto: UpdateProductDto) {
    await this.prisma.product.findUniqueOrThrow({ where: { id } });

    // If admin is explicitly enabling, verify the gate first
    if (dto.isActive === true) {
        const current = await this.prisma.product.findUnique({
            where:  { id },
            select: { price: true, images: true, pricingStatus: true },
        });
        if (current && !evaluateActive(
            (dto.price ?? current.price) as number,
            (dto.images ?? current.images) as string[],
            current.pricingStatus as string,
        )) {
            throw new BadRequestException(
                'Cannot enable product: requires a price > £0, at least one image, and no pricing flag.',
            );
        }
    }

    // If price is being manually set to a positive value, mark as manual
    const extraData: Record<string, unknown> = {};
    if (typeof dto.price === 'number' && dto.price > 0) {
        extraData['pricingStatus'] = 'manual';
    }

    const updated = await this.prisma.product.update({
        where: { id },
        data:  { ...(dto as never), ...extraData },
    });

    // Re-evaluate isActive based on final persisted state (unless admin explicitly set it)
    if (dto.isActive === undefined) {
        await this.revalidateActive(id);
    }

    return updated;
}
```

- [ ] **Step 6: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/products/
git commit -m "feat(pricing): enforce evaluateActive gate in ProductsService"
```

---

## Task 12: Update TradeInsService.aiPrice() — deterministic priority chain

**Files:**
- Modify: `apps/api/src/modules/trade-ins/trade-ins.service.ts`
- Modify: `apps/api/src/modules/trade-ins/trade-ins.module.ts`

- [ ] **Step 1: Import ProductPricingModule in TradeInsModule**

Open `apps/api/src/modules/trade-ins/trade-ins.module.ts` and add:

```typescript
import { ProductPricingModule } from '../product-pricing/product-pricing.module';
```

Add `ProductPricingModule` to `imports`.

- [ ] **Step 2: Inject ProductPricingService into TradeInsService**

At the top of `trade-ins.service.ts`, add:

```typescript
import { ProductPricingService } from '../product-pricing/product-pricing.service';
```

Add `private readonly productPricing: ProductPricingService` to the constructor.

- [ ] **Step 3: Replace the aiPrice() method's first block**

Find the `aiPrice()` method. Replace from the start of the method body up to (and including) the `if (scrapedMarketPrice !== null)` block with:

```typescript
async aiPrice(dto: AiPriceDto): Promise<{ price: number; aiUsed: boolean; source?: string }> {
    const storage = (dto.specs as Record<string, string>)?.storage
                 ?? (dto.specs as Record<string, string>)?.Storage
                 ?? '';

    // Priority 1 & 2: deterministic anchor from catalog/scraped prices
    const anchor = await this.productPricing.getTradeInAnchor(
        dto.brand, dto.model, storage, dto.condition,
    );
    if (anchor !== null) {
        this.logger.log(
            `Trade-in anchor for ${dto.brand} ${dto.model} ${storage} (${dto.condition}): £${anchor}`,
        );
        return { price: anchor, aiUsed: false, source: 'anchor' };
    }

    // Priority 3: AI fallback with full context
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new InternalServerErrorException('AI pricing is not configured');

    const openai = new OpenAI({ apiKey });
```

Then keep the rest of the existing AI block unchanged, but update the system message to include context:

Find the `systemMessage` variable and replace it with:

```typescript
    const configs      = await this.getMarginPct(); // reuse existing helper
    const specsText    = Object.entries(dto.specs).map(([k, v]) => `${k}: ${v}`).join(', ');
    const answersText  = Object.entries(dto.answers).map(([k, v]) => `${k}: ${v}`).join(', ');

    const systemMessage = `You are a UK second-hand electronics pricing expert for a refurbished device buyback service. You must always respond with a JSON object containing a "price" field. Be deterministic — given the same inputs always return the same price. Never return an empty object.`;
```

- [ ] **Step 4: Add source field to existing AI return**

Near the end of `aiPrice()`, find the final return:

```typescript
return { price: applyMargin(marketPrice, marginPct), aiUsed: true };
```

Replace with:

```typescript
return { price: applyMargin(marketPrice, marginPct), aiUsed: true, source: 'ai' };
```

- [ ] **Step 5: Verify compilation**

```bash
cd apps/api && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/trade-ins/
git commit -m "feat(pricing): deterministic trade-in anchor in aiPrice()"
```

---

## Task 13: Admin API client additions

**Files:**
- Modify: `apps/admin/lib/api.ts`

- [ ] **Step 1: Add pricingStatus to Product interface**

Find the `export interface Product` and add the field:

```typescript
export interface Product {
  id: string;
  // ... existing fields ...
  pricingStatus: 'auto_priced' | 'manual' | 'flagged' | 'no_data';
  // ... rest of fields ...
}
```

- [ ] **Step 2: Add EstimateResult interface**

Add after the `ScraperRun` interface:

```typescript
export interface ScrapedPricesSnapshot {
  cexSellPrice:     number | null;
  cexCashPrice:     number | null;
  cexExchangePrice: number | null;
  envirofonePrice:  number | null;
  marketPrice:      number | null;
  scrapedAt:        string;
}

export interface EstimateResult {
  low:           number;
  high:          number;
  suggested:     number;
  marketPrice:   number | null;
  scrapedPrices: ScrapedPricesSnapshot | null;
}

export interface PricingRunResult {
  applied: number;
  flagged: number;
  skipped: number;
}
```

- [ ] **Step 3: Add productPricingApi**

Add after `scraperApi`:

```typescript
export const productPricingApi = {
  run: () =>
    apiFetch<PricingRunResult>('/product-pricing/run', { method: 'POST' }),

  priceOne: (id: string) =>
    apiFetch<{ status: string; candidatePrice?: number }>(`/product-pricing/product/${id}`, { method: 'POST' }),

  estimate: (brand: string, model: string, storage: string, condition: string) => {
    const q = new URLSearchParams({ brand, model, storage, condition });
    return apiFetch<EstimateResult>(`/product-pricing/estimate?${q}`);
  },

  flagged: () =>
    apiFetch<{ id: string; name: string; condition: string; storage: string; updatedAt: string }[]>(
      '/product-pricing/flagged',
    ),
};
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/lib/api.ts
git commit -m "feat(admin): add productPricingApi and EstimateResult types"
```

---

## Task 14: Admin products list — badges, toggle, Auto-price All, Flagged filter

**Files:**
- Modify: `apps/admin/app/products/page.tsx`

- [ ] **Step 1: Add imports**

At the top of `page.tsx`, add to the existing lucide import:

```typescript
import { Search, Plus, Edit2, Trash2, X, Check, Package, Image as ImageIcon,
  ChevronDown, ExternalLink, AlertTriangle, Zap, ToggleLeft, ToggleRight,
  RefreshCw } from "lucide-react";
import { productsApi, deviceCatalogApi, productPricingApi,
  type Product, type CreateProductPayload, type DeviceCatalogItem,
  type PricingRunResult } from "../../lib/api";
```

- [ ] **Step 2: Add new state variables**

Inside `ProductsPage`, after the existing state declarations add:

```typescript
const [filterStatus, setFilterStatus]       = useState<string>("All");
const [autoPricing, setAutoPricing]         = useState(false);
const [autoPriceResult, setAutoPriceResult] = useState<PricingRunResult | null>(null);
const [togglingId, setTogglingId]           = useState<string | null>(null);
```

- [ ] **Step 3: Add handleAutoPrice and handleToggleActive functions**

After the existing `handleDelete` function add:

```typescript
async function handleAutoPrice() {
  setAutoPricing(true);
  setAutoPriceResult(null);
  try {
    const result = await productPricingApi.run();
    setAutoPriceResult(result);
    loadProducts(); // refresh list
    setTimeout(() => setAutoPriceResult(null), 6000);
  } catch (e: any) {
    alert(e.message ?? "Auto-pricing failed");
  } finally {
    setAutoPricing(false);
  }
}

async function handleToggleActive(product: Product) {
  setTogglingId(product.id);
  try {
    await productsApi.update(product.id, { isActive: !product.isActive });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
  } catch (e: any) {
    alert(e.message ?? "Toggle failed");
  } finally {
    setTogglingId(null);
  }
}
```

- [ ] **Step 4: Apply filterStatus to the displayed list**

Find where `filteredProducts` is computed (or where products are filtered for display). Add a `filterStatus` clause:

```typescript
const filteredProducts = products.filter(p => {
  const matchSearch   = !search || p.name.toLowerCase().includes(search.toLowerCase())
                        || p.brand.toLowerCase().includes(search.toLowerCase());
  const matchCategory = filterCategory === "All" || p.category === filterCategory;
  const matchStatus   = filterStatus === "All"
                        || (filterStatus === "Flagged" && p.pricingStatus === "flagged")
                        || (filterStatus === "No Price" && p.price === 0)
                        || (filterStatus === "Auto-priced" && p.pricingStatus === "auto_priced");
  return matchSearch && matchCategory && matchStatus && !OTHERS_SLUGS.has(p.category?.toLowerCase());
});
```

- [ ] **Step 5: Add "Auto-price All" button and status filter tabs to the header area**

Find the section that renders the search/filter bar at the top of the products list. Add:

```tsx
{/* Status filter tabs */}
<div className="flex items-center gap-2 mt-3">
  {["All", "Auto-priced", "Flagged", "No Price"].map(tab => (
    <button
      key={tab}
      onClick={() => setFilterStatus(tab)}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
        filterStatus === tab
          ? tab === "Flagged" ? "bg-amber-100 text-amber-700" : "bg-black text-white"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
      }`}
    >
      {tab}
    </button>
  ))}
  <div className="flex-1" />
  {autoPriceResult && (
    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
      ✓ {autoPriceResult.applied} priced · {autoPriceResult.flagged} flagged
    </span>
  )}
  <button
    onClick={handleAutoPrice}
    disabled={autoPricing}
    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
  >
    {autoPricing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
    Auto-price All
  </button>
</div>
```

- [ ] **Step 6: Add per-row badges and enable/disable toggle**

In the product table rows, add two new cells. Find the table row `<tr>` for each product and add:

```tsx
{/* pricingStatus badge */}
<td className="px-4 py-3 whitespace-nowrap">
  {p.pricingStatus === 'auto_priced' && (
    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">Auto-priced</span>
  )}
  {p.pricingStatus === 'manual' && (
    <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-lg">Manual</span>
  )}
  {p.pricingStatus === 'flagged' && (
    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">⚠ Flagged</span>
  )}
  {p.pricingStatus === 'no_data' && (
    <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-lg">No price data</span>
  )}
  {p.stock === 0 && (
    <span className="ml-1 text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg">Out of stock</span>
  )}
</td>

{/* enable/disable toggle */}
<td className="px-4 py-3">
  <button
    onClick={() => handleToggleActive(p)}
    disabled={togglingId === p.id || (!p.isActive && (p.price === 0 || p.images.length === 0))}
    title={!p.isActive && p.price === 0 ? "Set a price to enable" : ""}
    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${
      p.isActive
        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
    }`}
  >
    {togglingId === p.id
      ? <RefreshCw className="h-3 w-3 animate-spin" />
      : p.isActive
        ? <ToggleRight className="h-3.5 w-3.5" />
        : <ToggleLeft  className="h-3.5 w-3.5" />
    }
    {p.isActive ? "Live" : "Disabled"}
  </button>
</td>
```

Also add the matching `<th>` headers in the table head row:

```tsx
<th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
<th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Active</th>
```

- [ ] **Step 7: Commit**

```bash
git add apps/admin/app/products/page.tsx
git commit -m "feat(admin): products list — badges, toggle, auto-price all, flagged filter"
```

---

## Task 15: Admin product edit modal — Pricing Panel

**Files:**
- Modify: `apps/admin/app/products/page.tsx`

- [ ] **Step 1: Add pricing panel state variables**

After the existing modal state variables in `ProductsPage`, add:

```typescript
const [estimate, setEstimate]           = useState<import("../../lib/api").EstimateResult | null>(null);
const [loadingEstimate, setLoadingEstimate] = useState(false);
const [pricingProductId, setPricingProductId] = useState<string | null>(null);
```

- [ ] **Step 2: Add loadEstimate function**

Add after the `handleToggleActive` function:

```typescript
async function loadEstimate(brand: string, model: string, storage: string, condition: string) {
  if (!brand || !model) return;
  setLoadingEstimate(true);
  setEstimate(null);
  try {
    const result = await productPricingApi.estimate(brand, model, storage, condition);
    setEstimate(result);
  } catch {
    setEstimate(null);
  } finally {
    setLoadingEstimate(false);
  }
}
```

- [ ] **Step 3: Trigger loadEstimate when modal opens for a catalog product**

Find where `setShowModal(true)` is called (when opening the edit modal). After it, call:

```typescript
// Load pricing estimate when editing a catalog product
if (product.catalogId && product.brand && product.model) {
  loadEstimate(product.brand, product.model, product.storage ?? '', product.condition);
}
```

Also call it when the `Add Product` modal opens with a selected device:

```typescript
// After selectedDevice is set in the picker
if (selectedDevice) {
  const brand = selectedDevice.brandCategory.brand.name;
  loadEstimate(brand, selectedDevice.model, formData.storage ?? '', formData.condition);
}
```

Also clear estimate when modal closes: `setEstimate(null)` wherever `setShowModal(false)` is called.

- [ ] **Step 4: Add Pricing Panel inside the modal form**

Find the price input fields inside the modal (`formData.price`, `formData.comparePrice`). Add the Pricing Panel **above** the price inputs:

```tsx
{/* ── Pricing Panel (catalog products only) ─────────────────── */}
{(editProduct?.catalogId || selectedDevice) && (
  <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4 space-y-3">
    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pricing Intelligence</p>

    {/* Scraped competitor prices */}
    {loadingEstimate && (
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading competitor prices…
      </div>
    )}

    {estimate?.scrapedPrices && (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
          Competitor prices · {new Date(estimate.scrapedPrices.scrapedAt).toLocaleDateString('en-GB')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "CeX Sell",  value: estimate.scrapedPrices.cexSellPrice },
            { label: "CeX Cash",  value: estimate.scrapedPrices.cexCashPrice },
            { label: "Envirofone",value: estimate.scrapedPrices.envirofonePrice },
            { label: "Best",      value: estimate.scrapedPrices.marketPrice },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-zinc-200 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-zinc-400">{label}</p>
              <p className="text-sm font-bold text-zinc-800 mt-0.5">
                {value !== null ? `£${value.toFixed(0)}` : <span className="text-zinc-300">—</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* AI estimate range */}
    {estimate && (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
          AI estimate range · {formData.condition}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-600">£{estimate.low}</span>
          <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full"
              style={{
                marginLeft: `${Math.min(90, Math.max(0,
                  ((estimate.suggested - estimate.low) / Math.max(1, estimate.high - estimate.low)) * 80
                ))}%`,
                width: '10%',
              }}
            />
          </div>
          <span className="text-sm font-bold text-zinc-600">£{estimate.high}</span>
          <button
            type="button"
            onClick={() => setFormData(f => ({ ...f, price: estimate.suggested }))}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Zap className="h-3 w-3" /> Auto-fill £{estimate.suggested}
          </button>
        </div>
      </div>
    )}

    {/* "Auto-price this product" for existing products */}
    {editProduct?.id && (
      <button
        type="button"
        disabled={pricingProductId === editProduct.id}
        onClick={async () => {
          setPricingProductId(editProduct.id);
          try {
            const result = await productPricingApi.priceOne(editProduct.id);
            if (result.candidatePrice) {
              setFormData(f => ({ ...f, price: result.candidatePrice! }));
            }
            await loadEstimate(
              editProduct.brand, editProduct.model,
              editProduct.storage ?? '', editProduct.condition,
            );
          } catch (e: any) { alert(e.message ?? 'Pricing failed'); }
          finally { setPricingProductId(null); }
        }}
        className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pricingProductId === editProduct.id
          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          : <Zap className="h-3.5 w-3.5" />
        }
        Auto-price this product
      </button>
    )}
  </div>
)}

{/* Inline range feedback on the price input */}
{estimate && formData.price > 0 && (
  formData.price >= estimate.low && formData.price <= estimate.high ? (
    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
      <Check className="h-3 w-3" /> Price is within AI estimate range (£{estimate.low}–£{estimate.high})
    </p>
  ) : (
    <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" /> Price is outside AI range (£{estimate.low}–£{estimate.high}) — you can still save
    </p>
  )
)}
```

- [ ] **Step 5: Verify modal renders without errors**

Start the admin dev server:

```bash
cd apps/admin && npm run dev
```

Open `http://localhost:3001/products`, click "Edit" on a catalog product. Confirm:
- Pricing Panel appears below the product info
- Scraped prices table loads (or shows loading spinner)
- AI range bar appears
- Auto-fill button sets the price field

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/products/page.tsx
git commit -m "feat(admin): pricing panel in product edit modal"
```

---

## Task 16: Web storefront — Out of Stock badge always visible

**Files:**
- Modify: `apps/web/app/shop/[category]/page.tsx`

- [ ] **Step 1: Find the out-of-stock card section**

Open `apps/web/app/shop/[category]/page.tsx`. Find the block around line 774 that contains:

```tsx
className={`... ${product.stock === 0 ? "border-zinc-200 opacity-75" : ...}`}
```

- [ ] **Step 2: Remove opacity reduction and improve badge**

Change the card wrapper so out-of-stock products stay fully visible:

```tsx
className={`bg-white rounded-[32px] p-3 border transition-all duration-300 h-full flex flex-col ${
  product.stock === 0
    ? "border-zinc-200 hover:border-zinc-300"
    : "border-zinc-200 hover:border-black hover:shadow-xl"
}`}
```

Find the out-of-stock badge (around line 781) and ensure it's clearly styled:

```tsx
{product.stock === 0 && (
  <span className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg border border-orange-200">
    Out of Stock
  </span>
)}
```

Remove the `grayscale` class from the product image when stock is 0 (find `grayscale` and remove it — greying out the image alongside the badge is redundant and makes products look broken).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/shop/[category]/page.tsx
git commit -m "feat(web): improve out-of-stock badge — keep product fully visible"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Section 3 (formula): Tasks 3, 5, 6, 8
- ✅ Section 4 (condition mapping): Task 3 `conditionToMultiplierKey`
- ✅ Section 5 (backend architecture): Tasks 4–9
- ✅ Section 6 (migration): Task 1
- ✅ Section 7 (auto-enable/disable): Tasks 6, 11
- ✅ Section 8 (admin UI): Tasks 14, 15
- ✅ Section 9 (trade-in): Tasks 8, 12
- ✅ Section 10 (error handling): `getAiRange` fallback (Task 4), `BadRequestException` (Task 11)
- ✅ Section 11 (tradein_ratio config): Task 2

**Type consistency:**
- `PricingDetail`, `PricingRunResult`, `EstimateResult`, `ScrapedPricesSnapshot` defined in Task 4 DTO, used consistently in Tasks 5–9, 13
- `evaluateActive()` defined in Task 3, imported in Tasks 6, 11
- `computeCandidatePrice()`, `computeTradeInOffer()`, `round5()` defined in Task 3, used in Tasks 6, 8

**No placeholders:** All steps contain complete code. ✅

# Product Condition Grading System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text condition system (Pristine/Excellent/Good/Fair) with a CEX-style enum grading system: New, A Grade, B Grade, C Grade, F Grade — across the DB, API, admin UI, and customer-facing web.

**Architecture:** Add a `Condition` Prisma enum (`NEW | A | B | C | F`), migrate existing string data via a custom SQL migration, update pricing multiplier keys to match the 5 grades, and propagate the new grades through all UI layers using a shared `GRADE_CONFIG` constant.

**Tech Stack:** PostgreSQL + Prisma ORM, NestJS (API), Next.js 14 (web + admin), class-validator (DTOs), Jest (unit tests), Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-06-08-product-condition-grading-design.md`

---

## File Map

| File | Action | What changes |
|---|---|---|
| `apps/api/prisma/schema.prisma` | Modify | Add `Condition` enum; change `Product.condition` and `TradeIn.condition` to `Condition` |
| `apps/api/prisma/migrations/<timestamp>_condition_grading/migration.sql` | Create/edit | Custom SQL: add enum type, migrate data, remove old pricing keys |
| `apps/api/src/modules/product-pricing/product-pricing.helpers.ts` | Modify | `conditionToMultiplierKey` maps NEW/A/B/C/F |
| `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts` | Modify | Update `conditionToMultiplierKey` test cases |
| `apps/api/src/modules/pricing-config/pricing-config.service.ts` | Modify | `DEFAULTS` uses 5 new multiplier keys |
| `apps/admin/app/pricing/page.tsx` | Modify | `CONDITION_SCHEMA` + `DEFAULTS` + `CONDITIONS` preview → 5 new entries |
| `apps/api/src/modules/products/dto/create-product.dto.ts` | Modify | `condition` uses `@IsIn` enum validation |
| `apps/api/src/modules/trade-ins/dto/create-trade-in.dto.ts` | Modify | `condition` uses `@IsIn` enum validation |
| `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts` | Modify | `condition` uses `@IsIn` enum validation |
| `apps/api/src/modules/seed/seed.service.ts` | Modify | Seeded `'Pristine'` → `'A'` |
| `apps/web/lib/grades.ts` | Create | Shared `GRADE_CONFIG` constant for web |
| `apps/admin/app/products/page.tsx` | Modify | `CONDITIONS` → value/label pairs; `<option>` uses `value` |
| `apps/admin/app/products/[id]/page.tsx` | Modify | Same as above |
| `apps/admin/app/products/others/page.tsx` | Modify | Same as above |
| `apps/web/app/shop/[category]/page.tsx` | Modify | `GRADES` → enum keys; badge uses `GRADE_CONFIG` colors |
| `apps/web/app/shop/[category]/[slug]/page.tsx` | Modify | Replace `GRADE_COLORS`/`GRADE_DESC` with `GRADE_CONFIG` |
| `apps/web/app/page.tsx` | Modify | Replace `gradeDot`/`gradeColor`/`gradeClr` with `GRADE_CONFIG` |
| `apps/web/app/trade-in/page.tsx` | Modify | `CONDITIONS` → A/B/C/F grade cards |

---

## Task 1: Prisma Schema + Custom Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_condition_grading/migration.sql`

- [ ] **Step 1: Update schema.prisma**

Open `apps/api/prisma/schema.prisma`. Add the enum right after the existing enums block, and update both model fields:

```prisma
enum Condition {
  NEW
  A
  B
  C
  F
}
```

In `model Product`, change line `condition    String` to:
```prisma
  condition    Condition
```

In `model TradeIn`, change line `condition       String` to:
```prisma
  condition       Condition
```

- [ ] **Step 2: Generate migration stub (do NOT apply yet)**

Run from the repo root:
```bash
npm run api:prisma:migrate:dev -- --create-only --name condition_grading
```

Expected output:
```
Prisma schema loaded from apps/api/prisma/schema.prisma
Drift detected: Your database schema is not in sync with your migration history.

✔ We need to reset the PostgreSQL database "..." - all data will be lost.
... (or it may create without reset on a clean DB)

Created migration 'apps/api/prisma/migrations/YYYYMMDDHHMMSS_condition_grading/migration.sql'
```

Note the exact timestamp folder name that was created.

- [ ] **Step 3: Replace the generated migration.sql with custom data-migration SQL**

Find the generated file at `apps/api/prisma/migrations/<timestamp>_condition_grading/migration.sql` and **replace its entire contents** with:

```sql
-- CreateEnum
CREATE TYPE "Condition" AS ENUM ('NEW', 'A', 'B', 'C', 'F');

-- Migrate products.condition: add temp column, populate, swap
ALTER TABLE "products" ADD COLUMN "condition_new" "Condition";

UPDATE "products" SET "condition_new" = CASE
    WHEN LOWER("condition") IN ('pristine', 'excellent', 'mint') THEN 'A'::"Condition"
    WHEN LOWER("condition") IN ('very good', 'good')             THEN 'B'::"Condition"
    WHEN LOWER("condition") IN ('fair', 'damaged', 'used', 'refurbished') THEN 'C'::"Condition"
    ELSE 'B'::"Condition"
END;

ALTER TABLE "products" ALTER COLUMN "condition_new" SET NOT NULL;
ALTER TABLE "products" DROP COLUMN "condition";
ALTER TABLE "products" RENAME COLUMN "condition_new" TO "condition";

-- Migrate trade_ins.condition: add temp column, populate, swap
ALTER TABLE "trade_ins" ADD COLUMN "condition_new" "Condition";

UPDATE "trade_ins" SET "condition_new" = CASE
    WHEN LOWER("condition") IN ('pristine', 'excellent', 'mint', 'a grade', 'a') THEN 'A'::"Condition"
    WHEN LOWER("condition") IN ('good', 'very good', 'used', 'mint', 'b grade', 'b') THEN 'B'::"Condition"
    WHEN LOWER("condition") IN ('damaged', 'fair', 'heavy wear', 'c grade', 'c') THEN 'C'::"Condition"
    WHEN LOWER("condition") IN ('non-working', 'broken', 'f grade', 'f') THEN 'F'::"Condition"
    ELSE 'B'::"Condition"
END;

ALTER TABLE "trade_ins" ALTER COLUMN "condition_new" SET NOT NULL;
ALTER TABLE "trade_ins" DROP COLUMN "condition";
ALTER TABLE "trade_ins" RENAME COLUMN "condition_new" TO "condition";

-- Remove old pricing config keys (new ones are seeded by the service)
DELETE FROM "pricing_configs"
WHERE "key" IN ('multiplier_mint', 'multiplier_good', 'multiplier_used', 'multiplier_damaged');
```

- [ ] **Step 4: Apply the migration**

```bash
npm run api:prisma:migrate:dev
```

Expected output ends with:
```
The following migration(s) have been applied:

migrations/
  └─ YYYYMMDDHHMMSS_condition_grading/
    └─ migration.sql

✔ Generated Prisma Client
```

If it asks to reset the database, type `y` (dev environment only).

- [ ] **Step 5: Verify Prisma client regenerated**

```bash
npm run --workspace @ai-ecommerce/api typecheck
```

Expected: no errors about `Condition` type.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): add Condition enum and migrate product/trade-in condition columns"
```

---

## Task 2: Update conditionToMultiplierKey Helper (TDD)

**Files:**
- Modify: `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts`
- Modify: `apps/api/src/modules/product-pricing/product-pricing.helpers.ts`

- [ ] **Step 1: Replace conditionToMultiplierKey test cases**

In `apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts`, replace the entire `describe('conditionToMultiplierKey', ...)` block (lines 48–61) with:

```typescript
describe('conditionToMultiplierKey', () => {
    it('NEW → multiplier_new', () =>
        expect(conditionToMultiplierKey('NEW')).toBe('multiplier_new'));
    it('A → multiplier_a', () =>
        expect(conditionToMultiplierKey('A')).toBe('multiplier_a'));
    it('B → multiplier_b', () =>
        expect(conditionToMultiplierKey('B')).toBe('multiplier_b'));
    it('C → multiplier_c', () =>
        expect(conditionToMultiplierKey('C')).toBe('multiplier_c'));
    it('F → multiplier_f', () =>
        expect(conditionToMultiplierKey('F')).toBe('multiplier_f'));
    it('unknown → multiplier_b (safe fallback)', () =>
        expect(conditionToMultiplierKey('Unknown')).toBe('multiplier_b'));
});
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npm run --workspace @ai-ecommerce/api test -- --testPathPattern="product-pricing.helpers" --no-coverage
```

Expected: FAIL — tests for NEW/A/B/C/F will all fail with `received "multiplier_mint"` or similar.

- [ ] **Step 3: Replace the conditionToMultiplierKey implementation**

In `apps/api/src/modules/product-pricing/product-pricing.helpers.ts`, replace lines 44–53 (the entire `conditionToMultiplierKey` function) with:

```typescript
/**
 * Maps a product condition enum value to its PricingConfig multiplier key.
 * Condition enum values: NEW, A, B, C, F
 */
export function conditionToMultiplierKey(condition: string): string {
    switch (condition) {
        case 'NEW': return 'multiplier_new';
        case 'A':   return 'multiplier_a';
        case 'B':   return 'multiplier_b';
        case 'C':   return 'multiplier_c';
        case 'F':   return 'multiplier_f';
        default:    return 'multiplier_b';
    }
}
```

Also update the JSDoc comment on line 46 from:
```typescript
 * Product conditions: Pristine, Mint, Excellent, Very Good, Good, Fair, Refurbished
```
to:
```typescript
 * Condition enum values: NEW, A, B, C, F
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npm run --workspace @ai-ecommerce/api test -- --testPathPattern="product-pricing.helpers" --no-coverage
```

Expected:
```
PASS  src/modules/product-pricing/product-pricing.helpers.spec.ts
  conditionToMultiplierKey
    ✓ NEW → multiplier_new
    ✓ A → multiplier_a
    ✓ B → multiplier_b
    ✓ C → multiplier_c
    ✓ F → multiplier_f
    ✓ unknown → multiplier_b (safe fallback)
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/product-pricing/product-pricing.helpers.ts apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts
git commit -m "feat(pricing): update conditionToMultiplierKey for NEW/A/B/C/F grades"
```

---

## Task 3: Update Pricing-Config Service Defaults

**Files:**
- Modify: `apps/api/src/modules/pricing-config/pricing-config.service.ts`

- [ ] **Step 1: Replace the DEFAULTS array**

In `apps/api/src/modules/pricing-config/pricing-config.service.ts`, replace lines 9–18 (the `DEFAULTS` array and its comment block) with:

```typescript
// Default condition multipliers seeded on first read.
// Formula: price = marketPrice × conditionMultiplier × (1 + sellMargin/100) × (1 - sellDiscount/100)
// Grades: NEW (brand new) → A (like new) → B (minor wear) → C (heavy wear) → F (non-working)
const DEFAULTS: { key: string; value: number; label: string }[] = [
    { key: 'multiplier_new', value: 1.20, label: 'New condition multiplier (% of market price)' },
    { key: 'multiplier_a',   value: 1.05, label: 'A Grade multiplier — used but like new (% of market price)' },
    { key: 'multiplier_b',   value: 0.85, label: 'B Grade multiplier — minor signs of use (% of market price)' },
    { key: 'multiplier_c',   value: 0.65, label: 'C Grade multiplier — heavy scratches/marks (% of market price)' },
    { key: 'multiplier_f',   value: 0.25, label: 'F Grade multiplier — non-working, parts only (% of market price)' },
    { key: 'sell_margin_pct',    value: 0,    label: 'Sell margin % added on top of multiplier price (+/-)' },
    { key: 'sell_discount_pct', value: 0,    label: 'Sell discount % deducted from final price (0-50)' },
    { key: 'tradein_ratio',      value: 0.50, label: 'Trade-in offer ratio (% of resale price)' },
    { key: 'tradein_margin_pct', value: 0,    label: 'Trade-in margin % deducted from offer (+/-)' },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/pricing-config/pricing-config.service.ts
git commit -m "feat(pricing-config): replace 4 old multiplier keys with 5 grade-based keys"
```

---

## Task 4: Update Admin Pricing Page

**Files:**
- Modify: `apps/admin/app/pricing/page.tsx`

- [ ] **Step 1: Replace CONDITION_SCHEMA**

In `apps/admin/app/pricing/page.tsx`, replace lines 22–29 (the `CONDITION_SCHEMA` array) with:

```typescript
const CONDITION_SCHEMA: Omit<Modifier, "value">[] = [
  { label: "New",     key: "new",  backendKey: "multiplier_new", min: 80, max: 150, step: 1, unit: "%", desc: "Brand new, sealed or equivalent. Set above 100% to price above market.", isDecimalBackend: true },
  { label: "A Grade", key: "a",    backendKey: "multiplier_a",   min: 70, max: 130, step: 1, unit: "%", desc: "Used but like new — zero visible marks. Typically at or slightly above market.", isDecimalBackend: true },
  { label: "B Grade", key: "b",    backendKey: "multiplier_b",   min: 50, max: 110, step: 1, unit: "%", desc: "Minor signs of usage, small scratches. Typically 10–20% below market.", isDecimalBackend: true },
  { label: "C Grade", key: "c",    backendKey: "multiplier_c",   min: 30, max:  90, step: 1, unit: "%", desc: "Heavy scratches or marks, fully working. Typically 30–45% below market.", isDecimalBackend: true },
  { label: "F Grade", key: "f",    backendKey: "multiplier_f",   min: 10, max:  50, step: 1, unit: "%", desc: "Non-working — parts only. Very low value.", isDecimalBackend: true },
  { label: "Sell margin",    key: "sell_margin",    backendKey: "sell_margin_pct",    min: -50, max: 50, step: 1, unit: "%", desc: "Added on top of multiplier. +10% = 10% more, −10% = 10% less. 0 = no effect.", isDecimalBackend: false },
  { label: "Sell discount",  key: "sell_discount",  backendKey: "sell_discount_pct",  min:   0, max: 50, step: 1, unit: "%", desc: "Promotional discount deducted from final price. 20% off = set to 20. 0 = no discount.", isDecimalBackend: false },
];
```

- [ ] **Step 2: Replace DEFAULTS object (line 41–44)**

Replace lines 41–44 (the `DEFAULTS` Record) with:

```typescript
const DEFAULTS: Record<string, number> = {
  new: 120, a: 105, b: 85, c: 65, f: 25, sell_margin: 0, sell_discount: 0,
  tradein_ratio: 50, tradein_margin: 0, cracked_screen: 25, battery: 15, charging: 12, ai_buffer: 15,
};
```

- [ ] **Step 3: Replace CONDITIONS preview array (lines 131–136)**

Replace the `CONDITIONS` array (lines 131–136) with:

```typescript
  const CONDITIONS = [
    { key: "new", label: "New",     color: "text-zinc-900 bg-zinc-100 border-zinc-200" },
    { key: "a",   label: "A Grade", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    { key: "b",   label: "B Grade", color: "text-blue-700 bg-blue-50 border-blue-100" },
    { key: "c",   label: "C Grade", color: "text-amber-700 bg-amber-50 border-amber-100" },
    { key: "f",   label: "F Grade", color: "text-red-700 bg-red-50 border-red-100" },
  ];
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/pricing/page.tsx
git commit -m "feat(admin): update pricing page for 5-grade condition system"
```

---

## Task 5: Update DTOs

**Files:**
- Modify: `apps/api/src/modules/products/dto/create-product.dto.ts`
- Modify: `apps/api/src/modules/trade-ins/dto/create-trade-in.dto.ts`
- Modify: `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts`

- [ ] **Step 1: Update create-product.dto.ts**

In `apps/api/src/modules/products/dto/create-product.dto.ts`, add `IsIn` to the imports (line 1) and update the `condition` field:

Replace the imports line with:
```typescript
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Min,
} from 'class-validator';
```

Replace lines 29–35 (the `condition` field):
```typescript
    @IsIn(['NEW', 'A', 'B', 'C', 'F'])
    condition!: string;
```

- [ ] **Step 2: Update create-trade-in.dto.ts**

In `apps/api/src/modules/trade-ins/dto/create-trade-in.dto.ts`, replace lines 28–30 (the `condition` field):
```typescript
    @IsIn(['NEW', 'A', 'B', 'C', 'F'])
    condition!: string;
```

(The `IsIn` import is already present in this file on line 1.)

- [ ] **Step 3: Update price-estimate.dto.ts**

In `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts`, replace line 1 and line 7 (the `condition` field):

Replace the imports line:
```typescript
import { IsIn, IsString, IsNotEmpty } from 'class-validator';
```

Replace line 7 (the condition field in `PriceEstimateDto`):
```typescript
    @IsIn(['NEW', 'A', 'B', 'C', 'F']) condition!: string;
```

- [ ] **Step 4: Run typecheck**

```bash
npm run --workspace @ai-ecommerce/api typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/products/dto/create-product.dto.ts apps/api/src/modules/trade-ins/dto/create-trade-in.dto.ts apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts
git commit -m "feat(api): validate condition against NEW/A/B/C/F enum in all DTOs"
```

---

## Task 6: Update Seed Service

**Files:**
- Modify: `apps/api/src/modules/seed/seed.service.ts`

- [ ] **Step 1: Replace the seeded condition value**

In `apps/api/src/modules/seed/seed.service.ts` at line 646, change:
```typescript
condition:     'Pristine',
```
to:
```typescript
condition:     'A',
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/modules/seed/seed.service.ts
git commit -m "feat(seed): update seeded product condition from Pristine to A grade"
```

---

## Task 7: Create Shared GRADE_CONFIG (Web)

**Files:**
- Create: `apps/web/lib/grades.ts`

- [ ] **Step 1: Create the file**

Create `apps/web/lib/grades.ts` with the full content:

```typescript
export type GradeKey = 'NEW' | 'A' | 'B' | 'C' | 'F';

export interface GradeConfig {
  label: string;
  desc: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  bgClass: string;
  forParts?: boolean;
}

export const GRADE_CONFIG: Record<GradeKey, GradeConfig> = {
  NEW: {
    label: 'New',
    desc: 'Brand new, sealed or equivalent.',
    badgeClass: 'bg-zinc-950 text-white border-zinc-950',
    dotClass: 'bg-zinc-900',
    textClass: 'text-zinc-900',
    bgClass: 'bg-zinc-100',
  },
  A: {
    label: 'A Grade',
    desc: 'Used but like new — zero visible marks.',
    badgeClass: 'bg-emerald-500 text-white border-emerald-500',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
  },
  B: {
    label: 'B Grade',
    desc: 'Minor signs of usage, small scratches.',
    badgeClass: 'bg-blue-500 text-white border-blue-500',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
  },
  C: {
    label: 'C Grade',
    desc: 'Heavy scratches or marks, fully working.',
    badgeClass: 'bg-amber-500 text-white border-amber-500',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
  },
  F: {
    label: 'F Grade',
    desc: 'Non-working — for parts or repair only.',
    badgeClass: 'bg-red-500 text-white border-red-500',
    dotClass: 'bg-red-400',
    textClass: 'text-red-700',
    bgClass: 'bg-red-50',
    forParts: true,
  },
};

/** Returns the config for a grade key, with a safe fallback. */
export function getGradeConfig(condition: string): GradeConfig {
  return GRADE_CONFIG[condition as GradeKey] ?? {
    label: condition,
    desc: '',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dotClass: 'bg-zinc-400',
    textClass: 'text-zinc-700',
    bgClass: 'bg-zinc-100',
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/grades.ts
git commit -m "feat(web): add shared GRADE_CONFIG for condition badge display"
```

---

## Task 8: Update Admin Product Forms (3 Files)

**Files:**
- Modify: `apps/admin/app/products/page.tsx`
- Modify: `apps/admin/app/products/[id]/page.tsx`
- Modify: `apps/admin/app/products/others/page.tsx`

- [ ] **Step 1: Update apps/admin/app/products/page.tsx**

Find line 14:
```typescript
const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];
```
Replace with:
```typescript
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "A",   label: "A Grade" },
  { value: "B",   label: "B Grade" },
  { value: "C",   label: "C Grade" },
  { value: "F",   label: "F Grade" },
];
```

Find line 30 (the `EMPTY_FORM` default):
```typescript
  catalogId: "", name: "", condition: "Excellent",
```
Replace with:
```typescript
  catalogId: "", name: "", condition: "A",
```

Find all `<select>` dropdowns that render conditions (there are two in this file, around lines 707 and 995). Both currently render:
```tsx
{CONDITIONS.map(c => <option key={c}>{c}</option>)}
```
Replace both with:
```tsx
{CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
```

- [ ] **Step 2: Update apps/admin/app/products/[id]/page.tsx**

Find line 11:
```typescript
const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];
```
Replace with:
```typescript
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "A",   label: "A Grade" },
  { value: "B",   label: "B Grade" },
  { value: "C",   label: "C Grade" },
  { value: "F",   label: "F Grade" },
];
```

Find line 63 (the form initial state):
```typescript
    name: "", brand: "", model: "", category: "Phones", condition: "Excellent",
```
Replace with:
```typescript
    name: "", brand: "", model: "", category: "Phones", condition: "A",
```

Find the `<select>` that renders conditions (around line 343):
```tsx
{CONDITIONS.map(c => <option key={c}>{c}</option>)}
```
Replace with:
```tsx
{CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
```

- [ ] **Step 3: Update apps/admin/app/products/others/page.tsx**

Find line 16:
```typescript
const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];
```
Replace with:
```typescript
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "A",   label: "A Grade" },
  { value: "B",   label: "B Grade" },
  { value: "C",   label: "C Grade" },
  { value: "F",   label: "F Grade" },
];
```

Find line 22 (`EMPTY_FORM` default):
```typescript
  condition: "Pristine",
```
Replace with:
```typescript
  condition: "A",
```

Find the `<select>` that renders conditions (around line 503):
```tsx
<select value={formData.condition} onChange={e => setFormData(f => ({ ...f, condition: e.target.value }))}
```
The `.map` inside it currently renders `{CONDITIONS.map(c => <option key={c}>{c}</option>)}`. Replace with:
```tsx
{CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/products/page.tsx apps/admin/app/products/[id]/page.tsx apps/admin/app/products/others/page.tsx
git commit -m "feat(admin): update product forms to use NEW/A/B/C/F condition grades"
```

---

## Task 9: Update Shop Category Page (Filters + Product Card Badge)

**Files:**
- Modify: `apps/web/app/shop/[category]/page.tsx`

- [ ] **Step 1: Add GRADE_CONFIG import**

At the top of `apps/web/app/shop/[category]/page.tsx`, after the existing imports, add:
```typescript
import { GRADE_CONFIG, getGradeConfig } from '../../../lib/grades';
```

- [ ] **Step 2: Replace GRADES constant (line 140)**

Find:
```typescript
const GRADES = ["Pristine", "Excellent", "Very Good", "Good"];
```
Replace with:
```typescript
const GRADES = ["NEW", "A", "B", "C", "F"];
```

- [ ] **Step 3: Update filter buttons to show labels**

Find the grade filter buttons section (around line 691–707):
```tsx
{GRADES.map(g => {
  const isActive = activeGrades.includes(g);
  return (
    <button
      key={g}
      onClick={() => toggleFilter(g, activeGrades, setActiveGrades)}
      className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
        isActive
          ? "bg-black text-white border-black dark:bg-white dark:text-zinc-950 dark:border-white"
          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
      }`}
    >
      {g}
    </button>
  );
})}
```
Replace with:
```tsx
{GRADES.map(g => {
  const isActive = activeGrades.includes(g);
  return (
    <button
      key={g}
      onClick={() => toggleFilter(g, activeGrades, setActiveGrades)}
      className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
        isActive
          ? "bg-black text-white border-black dark:bg-white dark:text-zinc-950 dark:border-white"
          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
      }`}
    >
      {GRADE_CONFIG[g as keyof typeof GRADE_CONFIG]?.label ?? g}
    </button>
  );
})}
```

- [ ] **Step 4: Update the product card grade badge (around line 785–792)**

Find the grade badge in the product card (inside the main grid's `filtered.map`):
```tsx
<span className="inline-flex px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-black border border-zinc-200 shadow-sm uppercase tracking-wider">
  {product.grade}
</span>
```
Replace with:
```tsx
<span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm uppercase tracking-wider ${getGradeConfig(product.grade).badgeClass}`}>
  {getGradeConfig(product.grade).label}
</span>
{getGradeConfig(product.grade).forParts && (
  <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-[9px] font-bold text-red-700 uppercase tracking-wider">
    For Parts
  </span>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/shop/[category]/page.tsx
git commit -m "feat(web): update shop category page with new grade filters and colored badges"
```

---

## Task 10: Update Product Detail Page

**Files:**
- Modify: `apps/web/app/shop/[category]/[slug]/page.tsx`

- [ ] **Step 1: Add GRADE_CONFIG import**

At the top of `apps/web/app/shop/[category]/[slug]/page.tsx`, after the existing imports, add:
```typescript
import { getGradeConfig } from '../../../../lib/grades';
```

- [ ] **Step 2: Remove the GRADE_COLORS and GRADE_DESC records (lines 15–29)**

Delete lines 15–29:
```typescript
const GRADE_COLORS: Record<string, string> = {
  Pristine: "border-black bg-black text-white",
  Excellent: "border-black bg-black text-white",
  "Very Good": "border-black bg-black text-white",
  Good: "border-black bg-black text-white",
  Fair: "border-black bg-black text-white",
};

const GRADE_DESC: Record<string, string> = {
  Pristine: "Flawless condition — looks and works like new.",
  Excellent: "Tiny hairline marks only visible under bright light.",
  "Very Good": "Light surface scratches, fully functional.",
  Good: "Visible wear, scratches or minor dents.",
  Fair: "Heavy wear or cosmetic damage, 100% functional.",
};
```

- [ ] **Step 3: Update grade badge render (around line 286–292)**

Find:
```tsx
<span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm border ${GRADE_COLORS[product.condition] ?? "border-zinc-200 bg-zinc-100 text-zinc-900"}`}>
  {product.condition}
</span>
{GRADE_DESC[product.condition] && (
  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
    <Info className="h-3.5 w-3.5" /> {GRADE_DESC[product.condition]}
  </p>
)}
```
Replace with:
```tsx
<span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm border ${getGradeConfig(product.condition).badgeClass}`}>
  {getGradeConfig(product.condition).label}
</span>
{getGradeConfig(product.condition).forParts && (
  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-xs font-bold text-red-700 mt-1">
    For Parts / Non-Working
  </span>
)}
{getGradeConfig(product.condition).desc && (
  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
    <Info className="h-3.5 w-3.5" /> {getGradeConfig(product.condition).desc}
  </p>
)}
```

- [ ] **Step 4: Update the description fallback text (around line 376)**

Find:
```tsx
{product.description || `${product.name} in ${product.condition} condition. Fully tested and certified by our expert technicians.`}
```
Replace with:
```tsx
{product.description || `${product.name} in ${getGradeConfig(product.condition).label} condition. Fully tested and certified by our expert technicians.`}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/shop/[category]/[slug]/page.tsx
git commit -m "feat(web): update product detail page with GRADE_CONFIG badges and descriptions"
```

---

## Task 11: Update Home Page

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add GRADE_CONFIG import**

At the top of `apps/web/app/page.tsx`, after the existing imports, add:
```typescript
import { getGradeConfig } from '../lib/grades';
```

- [ ] **Step 2: Replace gradeDot record (lines 1024–1029)**

Find:
```typescript
  const gradeDot: Record<string, string> = {
    Pristine:   "bg-emerald-500",
    Excellent:  "bg-blue-500",
    "Very Good":"bg-violet-500",
    Good:       "bg-amber-500",
  };
```
Replace with:
```typescript
  // gradeDot removed — use getGradeConfig(condition).dotClass instead
```
(Delete the block entirely — the dot is now resolved via `getGradeConfig`.)

- [ ] **Step 3: Update grade dot usage (line 1065)**

Find:
```tsx
<span className={`h-2 w-2 rounded-full ${gradeDot[featured.condition]}`} />
{featured.condition}
```
Replace with:
```tsx
<span className={`h-2 w-2 rounded-full ${getGradeConfig(featured.condition).dotClass}`} />
{getGradeConfig(featured.condition).label}
```

- [ ] **Step 4: Replace gradeColor record (lines 1800–1804)**

Find:
```typescript
  const gradeColor: Record<string, string> = {
    Pristine:  "bg-emerald-50 text-emerald-700",
    Excellent: "bg-sky-50 text-sky-700",
    Good:      "bg-amber-50 text-amber-700",
  };
```
Delete this block entirely.

- [ ] **Step 5: Update gradeColor usage (line 1832)**

Find:
```tsx
<div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${gradeColor[item.condition]}`}>
  {item.condition}
</div>
```
Replace with:
```tsx
<div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getGradeConfig(item.condition).textClass} ${getGradeConfig(item.condition).bgClass}`}>
  {getGradeConfig(item.condition).label}
</div>
```

- [ ] **Step 6: Replace the two gradeClr ternary expressions**

There are two inline `const gradeClr = ...` blocks (around lines 736 and 777) — both look like:
```typescript
const gradeClr = p.condition === "Pristine" ? "text-emerald-700 bg-emerald-50" : p.condition === "Good" ? "text-amber-700 bg-amber-50" : "text-sky-700 bg-sky-50";
```

For each, replace with:
```typescript
const gradeClr = `${getGradeConfig(p.condition).textClass} ${getGradeConfig(p.condition).bgClass}`;
```

Also update the JSX that uses `gradeClr` near each one. The usage looks like:
```tsx
<span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${gradeClr}`}>{p.condition} Grade</span>
```
Replace with:
```tsx
<span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${gradeClr}`}>{getGradeConfig(p.condition).label}</span>
```

- [ ] **Step 7: Update grade badge in deal/product cards (around line 1747)**

Find:
```tsx
<span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">{p.condition}</span>
```
Replace with:
```tsx
<span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">{getGradeConfig(p.condition).label}</span>
```

Also at lines 1116–1117 (deals section dot + label):
```tsx
<span className={`h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full ${gradeDot[deal.condition]}`} />
{deal.condition}
```
Replace with:
```tsx
<span className={`h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full ${getGradeConfig(deal.condition).dotClass}`} />
{getGradeConfig(deal.condition).label}
```

- [ ] **Step 8: Typecheck web app**

```bash
npm run --workspace @ai-ecommerce/web typecheck
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): update home page grade badges using GRADE_CONFIG"
```

---

## Task 12: Update Trade-In Page

**Files:**
- Modify: `apps/web/app/trade-in/page.tsx`

- [ ] **Step 1: Replace CONDITIONS array (lines 130–135)**

Find:
```typescript
const CONDITIONS = [
  { id: "Mint",    label: "Mint",    desc: "Like new, no marks or scuffs",        color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-500/20", dot: "bg-emerald-400", descColor: "text-zinc-500 dark:text-emerald-400/70", multiplier: 1.0 },
  { id: "Good",    label: "Good",    desc: "Minor scuffs, fully working",          color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-500/20",           dot: "bg-blue-400",    descColor: "text-zinc-500 dark:text-blue-400/70",    multiplier: 0.82 },
  { id: "Used",    label: "Used",    desc: "Moderate wear, fully working",         color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-500/20",       dot: "bg-amber-400",   descColor: "text-zinc-500 dark:text-amber-400/70",   multiplier: 0.62 },
  { id: "Damaged", label: "Damaged", desc: "Cracked screen or body damage",        color: "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-500/20",               dot: "bg-red-400",     descColor: "text-zinc-500 dark:text-red-400/70",     multiplier: 0.3 },
];
```
Replace with:
```typescript
const CONDITIONS = [
  { id: "A", label: "A Grade", desc: "Used but like new — zero visible marks or scuffs",         color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-500/20", dot: "bg-emerald-400", descColor: "text-zinc-500 dark:text-emerald-400/70" },
  { id: "B", label: "B Grade", desc: "Minor signs of usage, small scratches",                    color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-500/20",           dot: "bg-blue-400",    descColor: "text-zinc-500 dark:text-blue-400/70" },
  { id: "C", label: "C Grade", desc: "Very heavily scratched or has visible marks, but working", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-500/20",       dot: "bg-amber-400",   descColor: "text-zinc-500 dark:text-amber-400/70" },
  { id: "F", label: "F Grade", desc: "Non-working — for parts or repair only",                   color: "bg-red-50 dark:bg-red-950/30 border-red-200/60 dark:border-red-500/20",               dot: "bg-red-400",     descColor: "text-zinc-500 dark:text-red-400/70" },
];
```

- [ ] **Step 2: Typecheck web app**

```bash
npm run --workspace @ai-ecommerce/web typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/trade-in/page.tsx
git commit -m "feat(web): update trade-in condition selector to A/B/C/F grades"
```

---

## Task 13: Fix Remaining Condition Display (Account Pages)

**Files:**
- Modify: `apps/web/app/account/orders/page.tsx`
- Modify: `apps/web/app/account/trade-ins/page.tsx`
- Modify: `apps/web/app/account/trade-ins/[id]/page.tsx`

- [ ] **Step 1: Update orders page (line 167)**

Add import at top of `apps/web/app/account/orders/page.tsx`:
```typescript
import { getGradeConfig } from '../../lib/grades';
```

Find line 167:
```tsx
{item.product.name} — {item.product.condition} × {item.quantity}
```
Replace with:
```tsx
{item.product.name} — {getGradeConfig(item.product.condition).label} × {item.quantity}
```

- [ ] **Step 2: Update trade-ins list page (line 67)**

Add import at top of `apps/web/app/account/trade-ins/page.tsx`:
```typescript
import { getGradeConfig } from '../../lib/grades';
```

Find line 67:
```tsx
<p className="text-xs text-zinc-400 font-medium">Condition: {t.condition}</p>
```
Replace with:
```tsx
<p className="text-xs text-zinc-400 font-medium">Condition: {getGradeConfig(t.condition).label}</p>
```

- [ ] **Step 3: Update trade-in detail page (line 220)**

Add import at top of `apps/web/app/account/trade-ins/[id]/page.tsx`:
```typescript
import { getGradeConfig } from '../../../lib/grades';
```

Find line 220:
```tsx
<p className="font-bold text-sm">{tradeIn.condition}</p>
```
Replace with:
```tsx
<p className="font-bold text-sm">{getGradeConfig(tradeIn.condition).label}</p>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/account/orders/page.tsx apps/web/app/account/trade-ins/page.tsx "apps/web/app/account/trade-ins/[id]/page.tsx"
git commit -m "feat(web): show grade labels in account orders and trade-in history pages"
```

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] `prisma migrate status` shows no pending migrations
- [ ] All 3 admin product forms submit enum values (NEW/A/B/C/F), not labels
- [ ] Product cards on `/shop/phones` show colored grade badges
- [ ] Product detail page shows correct grade label + description
- [ ] Trade-in form shows A/B/C/F grade cards
- [ ] Admin pricing page shows 5 condition rows
- [ ] `npm run --workspace @ai-ecommerce/api test` passes
- [ ] `npm run --workspace @ai-ecommerce/api typecheck` passes
- [ ] `npm run --workspace @ai-ecommerce/web typecheck` passes

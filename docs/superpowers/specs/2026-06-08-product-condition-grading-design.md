# Product Condition Grading System

**Date:** 2026-06-08  
**Status:** Approved  
**Author:** Muhammad Hasaam

---

## Overview

Replace the existing free-text condition system (`Pristine`, `Excellent`, `Very Good`, `Good`, `Fair`) with a structured CEX-style grading system: **New**, **A Grade**, **B Grade**, **C Grade**, **F Grade**. The new grades apply to all products, trade-in submissions, admin UI, and customer-facing pages.

---

## Grade Definitions

| Grade | Label | Meaning |
|---|---|---|
| `NEW` | New | Brand new condition, sealed or equivalent |
| `A` | A Grade | Used but like brand new — zero visible marks |
| `B` | B Grade | Minor signs of usage, small scratches |
| `C` | C Grade | Very heavily scratched or marks, fully working |
| `F` | F Grade | Non-working — for parts or repair |

F Grade products are visible on the customer storefront with a "For Parts / Non-Working" label.

---

## Section 1 — Data Model

### Prisma Schema

Add a `Condition` enum and update both `Product` and `TradeIn` models:

```prisma
enum Condition {
  NEW
  A
  B
  C
  F
}

model Product {
  // ...
  condition  Condition
  // ...
}

model TradeIn {
  // ...
  condition  Condition
  // ...
}
```

### Migration Strategy

A Prisma migration converts the existing `condition` string column to the enum using a `CASE` statement:

| Old value(s) | New value |
|---|---|
| `Pristine`, `Excellent`, `Mint` | `A` |
| `Very Good`, `Good` | `B` |
| `Fair`, `Damaged`, `Used`, `Refurbished` | `C` |
| Anything else | `B` (safe fallback) |

### Seed Data

Update the one seeded condition (`'Pristine'`) to `Condition.A`.

---

## Section 2 — API & Pricing

### Pricing Config Keys

Replace the 4 old multiplier keys with 5 new ones. Old keys (`multiplier_mint`, `multiplier_good`, `multiplier_used`, `multiplier_damaged`) are deleted from `pricing_configs` table and replaced with:

| Key | Default multiplier | Rationale |
|---|---|---|
| `multiplier_new` | 1.20 | Brand new commands a premium |
| `multiplier_a` | 1.05 | Used but like new |
| `multiplier_b` | 0.85 | Minor signs of usage |
| `multiplier_c` | 0.65 | Heavy scratches/marks |
| `multiplier_f` | 0.25 | Non-working, parts only |

### `conditionToMultiplierKey` Helper

File: `apps/api/src/modules/product-pricing/product-pricing.helpers.ts`

Updated to map enum values: `NEW→multiplier_new`, `A→multiplier_a`, `B→multiplier_b`, `C→multiplier_c`, `F→multiplier_f`.

### DTOs

- `apps/api/src/modules/products/dto/create-product.dto.ts` — `condition` field typed to `Condition` enum
- `apps/api/src/modules/trade-ins/dto/create-trade-in.dto.ts` — `condition` field typed to `Condition` enum
- `apps/api/src/modules/product-pricing/dto/price-estimate.dto.ts` — `condition` field typed to `Condition` enum

### Tests

`apps/api/src/modules/product-pricing/product-pricing.helpers.spec.ts` — update `conditionToMultiplierKey` test cases to use new grade values.

---

## Section 3 — Frontend / UI

### Shared Grade Config

New file: `apps/web/lib/grades.ts`

```ts
export const GRADE_CONFIG: Record<string, {
  label: string;
  desc: string;
  badgeClass: string;   // Tailwind classes for the pill badge
  dotClass: string;     // Tailwind class for the color dot
  forParts?: boolean;
}> = {
  NEW:  { label: "New",     desc: "Brand new, sealed or equivalent.",          badgeClass: "bg-black text-white border-black",                      dotClass: "bg-zinc-900" },
  A:    { label: "A Grade", desc: "Used but like new — zero visible marks.",    badgeClass: "bg-emerald-500 text-white border-emerald-500",           dotClass: "bg-emerald-400" },
  B:    { label: "B Grade", desc: "Minor signs of usage, small scratches.",     badgeClass: "bg-blue-500 text-white border-blue-500",                dotClass: "bg-blue-400" },
  C:    { label: "C Grade", desc: "Heavy scratches or marks, fully working.",   badgeClass: "bg-amber-500 text-white border-amber-500",              dotClass: "bg-amber-400" },
  F:    { label: "F Grade", desc: "Non-working — for parts or repair only.",    badgeClass: "bg-red-500 text-white border-red-500", dotClass: "bg-red-400", forParts: true },
};
```

### Product Card Badge (shop + home page)

The existing plain white `{product.grade}` pill badge is replaced with a colored pill using `GRADE_CONFIG[grade].badgeClass`. F Grade gets a secondary "For Parts" sub-label.

Files affected:
- `apps/web/app/shop/[category]/page.tsx` — main product grid card (line ~786)
- `apps/web/app/page.tsx` — home page product cards (multiple locations)

### Product Detail Page

File: `apps/web/app/shop/[category]/[slug]/page.tsx`

Replace inline `GRADE_COLORS` and `GRADE_DESC` records with `GRADE_CONFIG` lookups.

### Shop Category Page Filters

File: `apps/web/app/shop/[category]/page.tsx`

`GRADES` constant (line 140) updated from `["Pristine", "Excellent", "Very Good", "Good"]` to the enum keys `["NEW", "A", "B", "C", "F"]`. Filter buttons display `GRADE_CONFIG[g].label` while filtering uses `product.grade === g` (which matches the API enum value). This keeps display and comparison consistent.

### Home Page Grade Colors

File: `apps/web/app/page.tsx`

Inline `gradeClr`/`gradeDot` ternary chains replaced with `GRADE_CONFIG` lookups.

### Trade-In Page

File: `apps/web/app/trade-in/page.tsx`

The `CONDITIONS` array (line 130) updated from `[Mint, Good, Used, Damaged]` to A/B/C/F grades (no "New" — customers do not trade in sealed products). Each card uses new descriptions, colors from `GRADE_CONFIG`.

### Admin Pages

Three files updated — `CONDITIONS = ["Pristine", ...]` replaced with value/label pairs so the dropdown submits the enum key while displaying the label:

```ts
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "A",   label: "A Grade" },
  { value: "B",   label: "B Grade" },
  { value: "C",   label: "C Grade" },
  { value: "F",   label: "F Grade" },
];
```

Files:
- `apps/admin/app/products/page.tsx`
- `apps/admin/app/products/[id]/page.tsx`
- `apps/admin/app/products/others/page.tsx`

Select elements render `<option value={c.value}>{c.label}</option>`. Default condition value updated from `"Excellent"` to `"A"` in product forms.

Pricing config page (`apps/admin/app/pricing/page.tsx`) — `CONDITIONS` array updated with new keys and labels.

---

## Out of Scope

- Trade-in diagnostic questions (screen/battery/etc.) — these remain unchanged; they feed into the AI pricing calculation independently of the grade the customer selects.
- Review system — no changes needed.
- Order history display — condition is just displayed as a string; it updates automatically once DB values change.

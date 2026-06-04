# Other Products — Normalized Schema & Flow

**Date:** 2026-06-04  
**Status:** Approved

---

## Problem

Every product currently requires a `DeviceCatalog` entry, which in turn requires a `BrandCategory` (brand with logo + category with images). This is overkill for "other/sub" products like CDs, films, mouse, RAM, cables, etc. These products don't need logos, category images, or model-level catalog entries — they just need a grouping label (subcategory) and a brand name.

---

## Two Product Tracks

| | Main Product | Other/Sub Product |
|---|---|---|
| Category | Full `Category` record (slug, images) | Lightweight `OtherSubcategory` (name only) |
| Brand | Full `Brand` record (logo, slug) | Lightweight `OtherBrand` (name only) |
| Device Catalog | Required | Not used |
| Examples | iPhone 15, MacBook Air, PS5 | Mouse, RAM, HDMI cable, CD, film |

---

## Schema Changes

### New tables

```prisma
model OtherBrand {
  id        String    @id @default(uuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]
  @@map("other_brands")
}

model OtherSubcategory {
  id        String    @id @default(uuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]
  @@map("other_subcategories")
}
```

### Modified `Product` model

```prisma
model Product {
  id                 String            @id @default(uuid())

  // Main product track (one or the other, never both, never neither)
  catalogId          String?
  catalog            DeviceCatalog?    @relation(fields: [catalogId], references: [id])

  // Other product track
  otherBrandId       String?
  otherBrand         OtherBrand?       @relation(fields: [otherBrandId], references: [id])
  otherSubcategoryId String?
  otherSubcategory   OtherSubcategory? @relation(fields: [otherSubcategoryId], references: [id])

  // Shared fields (unchanged)
  name         String
  slug         String    @unique
  condition    String
  storage      String    @default("")
  price        Float
  comparePrice Float?
  stock        Int       @default(0)
  images       String[]
  specs        Json      @default("{}")
  description  String?
  rating       Float     @default(0)
  reviewCount  Int       @default(0)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  orderItems OrderItem[]
  reviews    Review[]

  @@index([catalogId])
  @@index([otherBrandId])
  @@index([otherSubcategoryId])
  @@index([condition])
  @@index([isActive, createdAt])
  @@map("products")
}
```

**Invariant (enforced at API level):** `(catalogId IS NOT NULL) XOR (otherBrandId IS NOT NULL AND otherSubcategoryId IS NOT NULL)`

---

## New API Endpoints

### OtherBrand

| Method | Path | Description |
|--------|------|-------------|
| GET | `/other-brands` | List all other brands |
| POST | `/other-brands` | Create new other brand `{ name }` |
| PATCH | `/other-brands/:id` | Rename `{ name }` |
| DELETE | `/other-brands/:id` | Delete (only if no products linked) |

### OtherSubcategory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/other-subcategories` | List all subcategories |
| POST | `/other-subcategories` | Create `{ name }` |
| PATCH | `/other-subcategories/:id` | Rename `{ name }` |
| DELETE | `/other-subcategories/:id` | Delete (only if no products linked) |

### Products API changes

`CreateProductDto` accepts **either**:
- `catalogId: string` (main product path, existing)
- `otherBrandId: string` + `otherSubcategoryId: string` (other product path, new)

`presignAndFlatten` updated: when `catalog` is null, derive `brand` from `otherBrand.name` and `category` from `otherSubcategory.name`.

---

## Admin UI Changes

### `/products/others` — Add Product Modal

Replace the Device Catalog picker with two new pickers:

**Subcategory picker:**
- Dropdown list of existing `OtherSubcategory` records
- Last item: `＋ Add new subcategory` → inline text input + confirm button appears below
- On confirm: calls `POST /other-subcategories`, adds to list, auto-selects the new entry

**Brand picker:**
- Dropdown list of existing `OtherBrand` records
- Last item: `＋ Add new brand` → inline text input + confirm button appears below
- On confirm: calls `POST /other-brands`, adds to list, auto-selects

### `/catalog/others` — Device Catalog Others page

- Remove this page entirely (other products no longer use Device Catalog)
- Or: redirect to `/products/others`
- Sidebar link updated accordingly

### `/catalog-mgmt/links/others` page

- Remove or redirect — no longer applicable

### Sidebar & navigation

- Remove "Catalog > Others" link
- "Products > Others" remains and becomes the single entry point for other products

---

## Migration

1. Add `OtherBrand` and `OtherSubcategory` tables
2. Make `catalogId` nullable on `Product`
3. Add `otherBrandId` and `otherSubcategoryId` nullable columns on `Product`
4. Existing products are unaffected (all have `catalogId` set, new columns null)

No data backfill needed — existing "other" products were previously linked via DeviceCatalog and remain linked that way until re-created under the new flow (or a one-time migration script is run, which is out of scope here).

---

## Slug Generation for Other Products

Current slug formula (main): `{brand}-{model}-{condition}[-{storage}]`

Other product slug: `{otherBrand.name}-{productName}-{condition}` — all lowercased, spaces → hyphens, with numeric suffix collision guard (same as existing logic).

---

## Out of Scope

- Migrating existing other-category products from DeviceCatalog to the new path
- OtherBrand / OtherSubcategory management UI pages (can be added later; inline creation in the picker is sufficient)
- Scraper integration for other products (not applicable)

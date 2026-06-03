# Promo Banners Admin Management — Design Spec

**Date:** 2026-05-31
**Status:** Approved

## Overview

Make the homepage hero carousel ("Promo Banners") fully manageable from the admin panel. Admins can create, edit, delete, reorder, and toggle slides. A new `/admin/banners` hub page organises all banner types with easy room for future additions.

---

## 1. Database Schema

Extend the existing `PromoSlide` Prisma model with additional columns. No existing fields are removed.

**New columns added to `promo_slides`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `tabTitle` | `String` | — | Short tab label shown in the carousel tab bar ("Expert Repairs") |
| `tag` | `String` | — | Small eyebrow label above the heading ("Certified Technicians") |
| `titleLine1` | `String` | — | First line of the large display heading |
| `titleLine2` | `String` | — | Second line of the large display heading |
| `titleItalic` | `String` | — | Italic accent word at the end of the heading |
| `badgeA` | `String` | `""` | Left floating badge text |
| `badgeB` | `String` | `""` | Right floating badge text |
| `specs` | `String` | `""` | Comma-separated spec chip labels (split to array in API response) |
| `themeColor` | `String` | — | Tailwind gradient class string (chosen from preset palette) |
| `bgGlow` | `String` | — | RGBA string for the ambient background glow |

**Kept as-is:** `id`, `imgKey`, `title` (meta title), `subtitle` (description paragraph), `btnText`, `btnLink`, `order`, `isActive`, `createdAt`, `updatedAt`.

One Prisma migration required. No data loss — new columns get sensible defaults or are nullable where appropriate.

---

## 2. API Endpoints

All new endpoints live in `BannersController` (`/banners`). Admin endpoints are guarded by `JwtAuthGuard` + `RolesGuard` with `ADMIN` role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/banners/promo-slides` | Public | **Extended** — now returns all fields including new ones. `specs` returned as `string[]`. `imgKey` resolved to `imgUrl`. |
| `POST` | `/banners/promo-slides` | Admin | Create a slide. Accepts all fields except `id`, `createdAt`, `updatedAt`. |
| `PATCH` | `/banners/promo-slides/:id` | Admin | Update any subset of slide fields. |
| `DELETE` | `/banners/promo-slides/:id` | Admin | Delete a slide. Also deletes S3/Garage image if `imgKey` is set. |
| `PATCH` | `/banners/promo-slides/:id/toggle` | Admin | Toggle `isActive`. |
| `PATCH` | `/banners/promo-slides/reorder` | Admin | Bulk reorder. Body: `[{ id: string, order: number }]`. |
| `POST` | `/banners/promo-slides/:id/image` | Admin | Multipart upload → stored to Garage/S3, `imgKey` updated. |
| `DELETE` | `/banners/promo-slides/:id/image` | Admin | Delete image from storage, set `imgKey = null`. |

**`specs` handling:** stored as a comma-separated string in the DB (`"Express Screen Fix,OEM Grade Parts,Repair Warranty"`), serialised to `string[]` in the API response, and joined back on write. Keeps Prisma schema flat without a join table.

**`themeColor` / `bgGlow`:** the API accepts and stores raw values. The admin UI constrains input to a preset palette (see Section 3).

---

## 3. Admin Panel

### 3a. Hub Page — `/admin/banners`

A navigation hub listing all banner sub-sections. Each sub-section is a card showing:
- Name and description
- Item count (active / total)
- Arrow/button to navigate to the sub-page

**Current sub-sections:**

| Card | Sub-page | Manages |
|------|----------|---------|
| Banner Images | `/admin/banners/images` | `Banner` model — product/category image banners from seed |
| Promo Banners | `/admin/banners/promo-banners` | `PromoSlide` model — homepage hero carousel |

Adding a new banner type in the future = adding one card entry. No structural changes needed.

### 3b. Banner Images Sub-page — `/admin/banners/images`

- Thumbnail grid of all `Banner` records
- Toggle active / inactive per banner — uses existing `PATCH /banners/:id/toggle`
- Delete banner (removes from DB + Garage/S3) — new `DELETE /banners/:id` endpoint needed
- Upload new banner image button (multipart → stored to Garage/S3, new `Banner` record created) — new `POST /banners` endpoint needed
- Back arrow → `/admin/banners`

**New `Banner` endpoints needed in `BannersController`:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/banners` | Admin | Upload image → new `Banner` record |
| `DELETE` | `/banners/:id` | Admin | Delete banner record + Garage/S3 image |

### 3c. Promo Banners Sub-page — `/admin/banners/promo-banners`

**List view:**
- One card per slide: thumbnail, tab title, order number, active badge, Edit / Delete / Toggle buttons
- Drag handle for manual reordering — order saved immediately on drop via bulk reorder endpoint
- "Add Slide" button opens the create modal

**Add / Edit modal** (shared form):

| Field | Input type | Notes |
|-------|-----------|-------|
| Tab title | Text | Short label for the tab bar |
| Tag | Text | Eyebrow label above heading |
| Title Line 1 | Text | First heading line |
| Title Line 2 | Text | Second heading line |
| Italic word | Text | Italic accent at end of heading |
| Description | Textarea | Paragraph below heading |
| Badge A | Text | Left floating badge |
| Badge B | Text | Right floating badge |
| Spec 1 / 2 / 3 | 3× Text | Chip labels |
| Button text | Text | CTA button label |
| Button link | Text | CTA button href |
| Theme color | Dropdown | 6 preset coloured swatches; `bgGlow` auto-populates on selection |
| Image | File upload + URL paste | Upload takes priority; shows preview before save |
| Active | Toggle switch | |

**Theme color presets** (matches existing carousel palette):

| Swatch | `themeColor` | `bgGlow` |
|--------|-------------|---------|
| Blue | `from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400` | `rgba(59,130,246,0.15)` |
| Amber | `from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400` | `rgba(245,158,11,0.15)` |
| Emerald | `from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400` | `rgba(16,185,129,0.15)` |
| Green | `from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-400` | `rgba(34,197,94,0.15)` |
| Purple | `from-purple-500 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400` | `rgba(168,85,247,0.15)` |
| Teal | `from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400` | `rgba(20,184,166,0.15)` |

**Delete behaviour:** shows a confirmation dialog before calling the API. If slide has an image, deletion also removes it from Garage/S3.

---

## 4. Frontend — Homepage

**File:** `apps/web/app/page.tsx` → `PromoCarouselBanner` component.

- Remove the entire `SLIDE_META` hardcoded array.
- Replace the `slideImgs` fetch with a single fetch of `GET /banners/promo-slides` that returns all fields.
- Map the API response directly to the carousel render — same JSX structure, driven by API data instead of `SLIDE_META`.
- **Loading state:** skeleton placeholder the same height as the carousel while the fetch is in flight.
- **Empty state:** if 0 active slides are returned, the carousel section renders nothing (collapses gracefully).
- No other frontend pages are affected.

---

## 5. File Touchpoints

| Layer | Files changed |
|-------|--------------|
| Prisma schema | `apps/api/prisma/schema.prisma` — add columns to `PromoSlide` |
| Migration | New file under `apps/api/prisma/migrations/` |
| API service | `apps/api/src/modules/banners/banners.service.ts` — extend `getPromoSlides`, add CRUD + image methods |
| API controller | `apps/api/src/modules/banners/banners.controller.ts` — add new endpoints |
| Admin API client | `apps/admin/lib/api.ts` — add `promoSlidesApi` and `bannerImagesApi` |
| Admin routing | `apps/admin/app/banners/page.tsx` (hub), `apps/admin/app/banners/images/page.tsx`, `apps/admin/app/banners/promo-banners/page.tsx` |
| Admin sidebar | Add "Banners" nav link |
| Web frontend | `apps/web/app/page.tsx` — `PromoCarouselBanner` fetch rewrite |
| Web API client | `apps/web/lib/api.ts` — `bannersApi.promoSlides` already exists; no change needed |

---

## 6. Out of Scope

- The repair page hero (separate hardcoded section — not the same carousel)
- Trade-in or shop promotional banners
- Role-based per-slide permissions
- Scheduling (show slide between date X and Y)

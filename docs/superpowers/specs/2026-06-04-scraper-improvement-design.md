# Scraper Improvement Design
**Date:** 2026-06-04  
**Status:** Approved

## Problem

The current competitor price scraper has two critical failures:

1. **BackMarket and MusicMagpie return 0% data** — Playwright HTML scraping is blocked by Cloudflare on both sites 100% of the time.
2. **Runs get stuck as "RUNNING" forever** — The hourly cron fires while the previous scrape is still in progress. Crashed runs are never marked FAILED. 10 of 14 historical runs are permanently stuck.
3. **CeX fails on ~40% of devices** — MacBooks, some iPads, some Samsung models return null because the matching logic is too strict for laptop-style model names.

## Solution Overview

Replace the broken Playwright HTML scrapers with **Jina.ai Reader** (`r.jina.ai`), a free service that renders pages server-side and returns clean plain text — bypassing Cloudflare. Add Envirofone as a fourth source. Fix run management and CeX matching.

---

## Section 1 — Source Strategy

| Source | Old Method | New Method |
|--------|-----------|------------|
| CeX | Algolia API interception (Playwright) | Keep + improve matching |
| BackMarket | Playwright HTML ❌ blocked | Jina.ai reader → markdown price parse |
| MusicMagpie | Playwright HTML ❌ blocked | Jina.ai reader → markdown price parse |
| Envirofone | None | Jina.ai reader → markdown price parse (new) |

### Jina.ai Reader

- **URL:** `GET https://r.jina.ai/{encoded-target-url}`
- **Free:** No API key required
- **Output:** Clean plain text / markdown with all page content
- **Bot protection:** Bypasses Cloudflare because Jina renders server-side from their IP pool

Example:
```
GET https://r.jina.ai/https://www.backmarket.co.uk/en-gb/search?q=Apple+iPhone+15+128GB
```
Returns markdown containing product names and `£NNN` price strings which are parsed with regex.

### Price Extraction

For Jina.ai sources, extract the first `£NNN` price that appears near the target storage variant in the markdown. Scoring:
1. Find all lines containing `£` 
2. Prefer lines that also contain the storage string (e.g. "128GB")
3. Fall back to the first price found if no storage match

### Envirofone

- Search URL: `https://www.envirofone.com/en/products/search/?q={query}`
- Fetched via Jina.ai reader
- Low bot protection — reliable

---

## Section 2 — CeX Matching Improvements

Current failures: MacBook Air M2 (2022), MacBook Air M1 (2020), some iPads, some Samsungs.

**Root cause:** The model name in our DeviceCatalog doesn't match CeX's exact `boxName`. For example:
- Our model: `MacBook Air M2 (2022)` → CeX lists as `Apple MacBook Air 13" M2 2022`

**Fix:**
1. If the initial CeX Algolia search returns null, retry with a simplified query (drop storage, drop year in parentheses)
2. Relax the "no Pro Max/Plus/Ultra" guard — it only applies to phones, not laptops
3. Lower the minimum score threshold for laptop/tablet devices

---

## Section 3 — Run Management Fixes

### Deduplication
Before creating a new `ScraperRun` record, check if any run with `status: RUNNING` exists. If yes, log a warning and return without starting — prevents stacking.

### Stuck Run Cleanup
At the start of every `runScraper()` call, find all `ScraperRun` records where:
- `status = RUNNING`
- `startedAt < now - 2 hours`

Mark them as `FAILED` with `errorMessage: 'Run timed out — marked failed on next start'`.

---

## Section 4 — Schema Changes

Add `envirofonePrice` to the `ScrapedPrice` model:

```prisma
model ScrapedPrice {
  // ... existing fields ...
  envirofonePrice  Float?   // new
}
```

Requires a Prisma migration in `apps/api`.

---

## Section 5 — Admin UI Changes

### Prices Table
Add **Envirofone** column between MusicMagpie and Market Price.

### Stats Row
Add **Envirofone** stat card (count of rows where `envirofonePrice IS NOT NULL`).

### Stuck Runs Banner
In the Run History section, if any runs are `RUNNING` and older than 2 hours, show a warning banner: _"N runs are stuck. Click to mark as failed."_ — calls a new `POST /scraper/cleanup` endpoint.

---

## Architecture (unchanged)

```
Admin (3001) → API (3002) /scraper/* → ScraperDataService
                                          ↓ triggerScraper()
                               Scraper Service (3003)
                                   ↓ Playwright (CeX Algolia)
                                   ↓ Jina.ai HTTP (BackMarket)
                                   ↓ Jina.ai HTTP (MusicMagpie)
                                   ↓ Jina.ai HTTP (Envirofone)
                                   ↓ writes → PostgreSQL ScrapedPrice
```

---

## Files Affected

| File | Change |
|------|--------|
| `apps/scraper/src/modules/scraper/scraper.service.ts` | Replace BM/MM scrapers with Jina.ai, add Envirofone, fix CeX matching, add deduplication + cleanup |
| `apps/api/prisma/schema.prisma` | Add `envirofonePrice Float?` to ScrapedPrice |
| `apps/api/prisma/migrations/...` | New migration for envirofonePrice |
| `apps/api/src/modules/scraper-data/scraper-data.controller.ts` | Add `POST /scraper/cleanup` endpoint |
| `apps/api/src/modules/scraper-data/scraper-data.service.ts` | Add `cleanupStuckRuns()`, update `getStats()` for envirofone |
| `apps/admin/app/scraper/page.tsx` | Add Envirofone column, stuck runs banner, cleanup button |

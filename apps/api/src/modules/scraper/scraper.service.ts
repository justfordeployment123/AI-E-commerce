import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { chromium } from 'playwright';
import type { BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// These are used inside page.evaluate() which runs in browser context — not Node.js globals
declare const document: any;
declare const navigator: any;
declare const globalThis: any;

interface CompetitorPrices {
    sellPrice: number | null;
    buyCashPrice?: number | null;
    buyExchangePrice?: number | null;
}

interface DevicePrices {
    cex: CompetitorPrices | null;
    backMarket: CompetitorPrices | null;
    musicMagpie: CompetitorPrices | null;
}

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    constructor(private readonly prisma: PrismaService) {}

    async runScraper(limit?: number): Promise<Record<string, DevicePrices>> {
        this.logger.log('Starting competitor price scraper…');

        const devices = await this.prisma.deviceCatalog.findMany({ where: { isActive: true } });
        this.logger.log(`Found ${devices.length} active devices in catalog.`);

        const searchItems: { brand: string; model: string; storage: string; fullName: string }[] = [];
        for (const dev of devices) {
            const options = dev.storageOptions?.length ? dev.storageOptions : [''];
            for (const storage of options) {
                searchItems.push({
                    brand:    dev.brand,
                    model:    dev.model,
                    storage:  storage as string,
                    fullName: storage ? `${dev.brand} ${dev.model} ${storage}` : `${dev.brand} ${dev.model}`,
                });
            }
        }

        const itemsToScrape = limit && limit > 0 ? searchItems.slice(0, limit) : searchItems;
        this.logger.log(`Scraping ${itemsToScrape.length} device variants.`);

        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-first-run',
            ],
        });

        const context = await browser.newContext({
            userAgent:    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport:     { width: 1366, height: 768 },
            locale:       'en-GB',
            timezoneId:   'Europe/London',
            extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
        });

        // Remove webdriver flag visible to JS-based bot detectors
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            globalThis.chrome = { runtime: {} };
        });

        const results: Record<string, DevicePrices> = {};

        try {
            for (const [i, item] of itemsToScrape.entries()) {
                this.logger.log(`[${i + 1}/${itemsToScrape.length}] "${item.fullName}"`);

                // CeX via Algolia interception — clean JSON, no HTML parsing needed
                const cex = await this.scrapeCeX(context, item.brand, item.model, item.storage);
                await this.delay(800);

                // BackMarket via HTML scraping (may hit Cloudflare — handled gracefully)
                const backMarket = await this.scrapeBackMarket(context, item.fullName, item.storage);
                await this.delay(1000);

                // MusicMagpie via HTML scraping
                const musicMagpie = await this.scrapeMusicMagpie(context, item.fullName, item.storage);

                results[item.fullName] = { cex, backMarket, musicMagpie };

                const marketPrice = cex?.sellPrice ?? backMarket?.sellPrice ?? musicMagpie?.sellPrice ?? null;

                await this.prisma.scrapedPrice.upsert({
                    where:  { deviceKey: item.fullName },
                    create: {
                        deviceKey:        item.fullName,
                        brand:            item.brand,
                        model:            item.model,
                        storage:          item.storage,
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                });

                this.logger.log(
                    `  └─ CeX=£${cex?.sellPrice ?? '—'}  BM=£${backMarket?.sellPrice ?? '—'}  MM=£${musicMagpie?.sellPrice ?? '—'}  → market=£${marketPrice ?? '—'}`,
                );

                if (i < itemsToScrape.length - 1) {
                    await this.delay(1500 + Math.random() * 1500);
                }
            }
        } finally {
            // Always close browser even if an item throws mid-loop
            await browser.close();
        }

        // Write JSON backup for debugging
        const downloadsDir = path.join(process.cwd(), 'prisma', 'downloads');
        if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });
        fs.writeFileSync(
            path.join(downloadsDir, 'scraped_prices.json'),
            JSON.stringify({ scrapedAt: new Date().toISOString(), totalScraped: itemsToScrape.length, prices: results }, null, 2),
            'utf-8',
        );

        this.logger.log(`Scraper finished — ${itemsToScrape.length} variants processed.`);
        return results;
    }

    // ─── CeX (Playwright + Algolia interception) ──────────────────────────────
    // CeX loads search results from Algolia (search.webuy.io). By intercepting
    // that network response we get clean JSON with all prices — no HTML parsing.
    private async scrapeCeX(context: BrowserContext, brand: string, model: string, storage: string): Promise<CompetitorPrices | null> {
        const query = [brand, model, storage].filter(Boolean).join(' ');
        const page = await context.newPage();
        try {
            // Set up Algolia response capture BEFORE navigation so we don't miss it
            const algoliaPromise = page.waitForResponse(
                r => r.url().includes('search.webuy.io') && r.status() === 200,
                { timeout: 30_000 },
            );

            await page.goto(
                `https://uk.webuy.com/search?stext=${encodeURIComponent(query)}`,
                { waitUntil: 'domcontentloaded', timeout: 35_000 },
            );

            const algoliaResp = await algoliaPromise;
            const json = await algoliaResp.json() as { results?: { hits?: any[] }[] };
            const hits: any[] = json?.results?.[0]?.hits ?? [];

            if (hits.length === 0) {
                this.logger.warn(`CeX: no Algolia hits for "${query}"`);
                return null;
            }

            const modelL    = model.toLowerCase();
            const storageL  = storage?.toLowerCase() ?? '';
            // Normalize storage for matching: "128 GB" → "128gb" to match CeX's "128GB"
            const storageN  = storageL.replace(/\s+/g, '');

            // Score: +2 for storage match, +1 for "unlocked", -999 if model missing or variant mismatch
            const score = (h: any): number => {
                const name = (h.boxName ?? '').toLowerCase();
                if (!name.includes(modelL)) return -999;
                // Prevent "iPhone 15 Pro" from matching "iPhone 15 Pro Max" (or Plus/Ultra/Mini variants)
                const afterModel = name.slice(name.indexOf(modelL) + modelL.length);
                if (/^\s+(max|plus|ultra|mini)\b/i.test(afterModel)) return -999;
                // Normalize name spaces too so "128 gb" matches "128gb" in CeX names
                const nameN = name.replace(/\s+/g, '');
                return (storageN && nameN.includes(storageN) ? 2 : 0) + (name.includes('unlocked') ? 1 : 0);
            };

            const best = hits.reduce((a, b) => (score(b) > score(a) ? b : a), hits[0]);
            if (score(best) < 0) {
                this.logger.warn(`CeX: no matching Algolia hit for "${query}"`);
                return null;
            }

            // cashBuyPrice/exchangePrice are often 0; use the calculated variants which are always correct
            const cash     = best.cashPriceCalculated     || best.cashBuyPrice     || null;
            const exchange = best.exchangePriceCalculated || best.exchangePrice    || null;

            this.logger.log(`CeX → "${best.boxName}" sell=£${best.sellPrice} cash=£${cash} exchange=£${exchange}`);

            return {
                sellPrice:        typeof best.sellPrice === 'number' && best.sellPrice > 0     ? best.sellPrice : null,
                buyCashPrice:     typeof cash           === 'number' && cash > 0               ? cash           : null,
                buyExchangePrice: typeof exchange       === 'number' && exchange > 0           ? exchange       : null,
            };
        } catch (e: any) {
            this.logger.error(`CeX error for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    // ─── BackMarket (Playwright HTML) ─────────────────────────────────────────
    private async scrapeBackMarket(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
        const page = await context.newPage();
        try {
            await page.goto(
                `https://www.backmarket.co.uk/en-gb/search?q=${encodeURIComponent(query)}`,
                { waitUntil: 'domcontentloaded', timeout: 30_000 },
            );
            await this.delay(3000);

            // Dismiss cookie banner if present
            try {
                const btn = await page.$('button[data-qa*="accept"], button[id*="accept"]');
                if (btn) { await btn.click(); await this.delay(600); }
            } catch { /* ignore */ }

            // Detect Cloudflare / bot challenge page
            const title    = await page.title();
            const bodyText = await page.evaluate(() => (document.body?.innerText ?? '').slice(0, 500));
            if (/just a moment|cloudflare|verify you are human|checking your browser/i.test(title + bodyText)) {
                this.logger.warn(`BackMarket: bot protection for "${query}"`);
                return null;
            }

            const priceText = await page.evaluate((storageVal: string) => {
                const isPrice = (t: string) => /^£\s*\d+/.test(t) && t.length < 25;
                const firstPrice = (root: any): string | null => {
                    for (const el of Array.from(root.querySelectorAll('*')) as any[]) {
                        if (!el.children.length) {
                            const t = (el.textContent ?? '').trim();
                            if (isPrice(t)) return t;
                        }
                    }
                    return null;
                };

                const cardSelectors = ['[data-qa="product-card"]', '[class*="productCard"]', '[class*="product-card"]', 'article'];
                for (const sel of cardSelectors) {
                    const cards = Array.from(document.querySelectorAll(sel)) as any[];
                    if (!cards.length) continue;

                    // Try to find a card matching the storage variant
                    for (const card of cards) {
                        if (storageVal && !(card.textContent ?? '').toLowerCase().includes(storageVal.toLowerCase())) continue;
                        const p = firstPrice(card);
                        if (p) return p;
                    }
                    // Fallback: first card regardless of storage
                    for (const card of cards) {
                        const p = firstPrice(card);
                        if (p) return p;
                    }
                    break;
                }

                // Last resort: any leaf element with a £ price
                for (const el of Array.from(document.querySelectorAll('*')) as any[]) {
                    if (!el.children.length) {
                        const t = (el.textContent ?? '').trim();
                        if (isPrice(t)) return t;
                    }
                }
                return null;
            }, storage);

            if (!priceText) {
                this.logger.warn(`BackMarket: no price for "${query}"`);
                return null;
            }

            const sellPrice = this.extractFirstPrice(priceText);
            if (!sellPrice) return null;

            this.logger.log(`BackMarket → "${query}": £${sellPrice}`);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`BackMarket error for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    // ─── MusicMagpie (Playwright HTML) ────────────────────────────────────────
    private async scrapeMusicMagpie(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
        const page = await context.newPage();
        try {
            await page.goto(
                `https://www.musicmagpie.co.uk/store/search?q=${encodeURIComponent(query)}`,
                { waitUntil: 'domcontentloaded', timeout: 30_000 },
            );
            await this.delay(2000);

            // Dismiss cookie consent
            try {
                const btn = await page.$('#onetrust-accept-btn-handler, button:has-text("Accept All"), button:has-text("Accept Cookies")');
                if (btn) { await btn.click(); await this.delay(500); }
            } catch { /* ignore */ }

            const priceText = await page.evaluate((storageVal: string) => {
                const isPrice = (t: string) => /^£\s*\d+/.test(t) && t.length < 25;
                const firstPrice = (root: any): string | null => {
                    for (const el of Array.from(root.querySelectorAll('*')) as any[]) {
                        if (!el.children.length) {
                            const t = (el.textContent ?? '').trim();
                            if (isPrice(t)) return t;
                        }
                    }
                    return null;
                };

                const cardSelectors = ['.product-card', '.product', 'article', '[class*="ProductCard"]', 'li[class*="product"]', '.item'];
                for (const sel of cardSelectors) {
                    const cards = Array.from(document.querySelectorAll(sel)) as any[];
                    if (!cards.length) continue;

                    // Storage-matched card first
                    for (const card of cards) {
                        if (storageVal && !(card.textContent ?? '').toLowerCase().includes(storageVal.toLowerCase())) continue;
                        const p = firstPrice(card);
                        if (p) return p;
                    }
                    // Any card
                    for (const card of cards) {
                        const p = firstPrice(card);
                        if (p) return p;
                    }
                    break;
                }

                // Last resort: any leaf with £
                for (const el of Array.from(document.querySelectorAll('*')) as any[]) {
                    if (!el.children.length) {
                        const t = (el.textContent ?? '').trim();
                        if (isPrice(t)) return t;
                    }
                }
                return null;
            }, storage);

            if (!priceText) {
                this.logger.warn(`MusicMagpie: no price for "${query}"`);
                return null;
            }

            const sellPrice = this.extractFirstPrice(priceText);
            if (!sellPrice) return null;

            this.logger.log(`MusicMagpie → "${query}": £${sellPrice}`);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`MusicMagpie error for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    // ─── Single-device scrape (for the "Re-scrape" button on catalog detail page) ─
    async scrapeDevice(brand: string, model: string): Promise<void> {
        this.logger.log(`Single-device scrape: ${brand} ${model}`);

        const device = await this.prisma.deviceCatalog.findFirst({
            where: {
                brand: { equals: brand, mode: 'insensitive' },
                model: { equals: model, mode: 'insensitive' },
            },
        });

        const storageOptions = device?.storageOptions?.length ? device.storageOptions as string[] : [''];
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
        });
        const context = await browser.newContext({
            userAgent:  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport:   { width: 1366, height: 768 },
            locale:     'en-GB',
            timezoneId: 'Europe/London',
            extraHTTPHeaders: { 'Accept-Language': 'en-GB,en;q=0.9' },
        });
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            globalThis.chrome = { runtime: {} };
        });

        try {
            for (const storage of storageOptions) {
                const fullName = storage ? `${brand} ${model} ${storage}` : `${brand} ${model}`;
                this.logger.log(`  Scraping "${fullName}"…`);

                const cex = await this.scrapeCeX(context, brand, model, storage);
                await this.delay(800);
                const backMarket  = await this.scrapeBackMarket(context, fullName, storage);
                await this.delay(1000);
                const musicMagpie = await this.scrapeMusicMagpie(context, fullName, storage);

                const marketPrice = cex?.sellPrice ?? backMarket?.sellPrice ?? musicMagpie?.sellPrice ?? null;

                await this.prisma.scrapedPrice.upsert({
                    where:  { deviceKey: fullName },
                    create: {
                        deviceKey: fullName, brand, model, storage,
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        marketPrice, scrapedAt: new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        marketPrice, scrapedAt: new Date(),
                    },
                });

                this.logger.log(`  └─ CeX=£${cex?.sellPrice ?? '—'}  → market=£${marketPrice ?? '—'}`);
            }
        } finally {
            await browser.close();
        }
    }

    // ─── Public helpers used by other services ────────────────────────────────

    async lookupPrice(brand: string, model: string, storage?: string, maxAgeDays = 7): Promise<number | null> {
        const deviceKey = [brand, model, storage].filter(Boolean).join(' ');
        const row = await this.prisma.scrapedPrice.findUnique({ where: { deviceKey } });
        if (!row || row.marketPrice === null) return null;

        const ageDays = (Date.now() - row.scrapedAt.getTime()) / 86_400_000;
        if (ageDays > maxAgeDays) {
            this.logger.log(`Stale scraped price for "${deviceKey}" (${Math.round(ageDays)}d) — falling back to AI`);
            return null;
        }

        this.logger.log(`Cache hit for "${deviceKey}": £${row.marketPrice} (${ageDays.toFixed(1)}d old)`);
        return row.marketPrice;
    }

    async listPrices(page = 1, limit = 50, search?: string) {
        const skip  = (page - 1) * limit;
        const where = search
            ? { OR: [{ brand: { contains: search, mode: 'insensitive' as const } }, { model: { contains: search, mode: 'insensitive' as const } }] }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.scrapedPrice.findMany({ where, skip, take: limit, orderBy: { scrapedAt: 'desc' } }),
            this.prisma.scrapedPrice.count({ where }),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async getDevicePrices(brand: string, model: string) {
        return this.prisma.scrapedPrice.findMany({
            where: {
                brand: { equals: brand, mode: 'insensitive' },
                model: { equals: model, mode: 'insensitive' },
            },
            orderBy: { storage: 'asc' },
        });
    }

    async getStats() {
        const [total, withMarketPrice, withCex, withBM, withMM, latest] = await Promise.all([
            this.prisma.scrapedPrice.count(),
            this.prisma.scrapedPrice.count({ where: { marketPrice:     { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { cexSellPrice:    { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { backMarketPrice: { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { musicMagpiePrice: { not: null } } }),
            this.prisma.scrapedPrice.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
        ]);
        return { total, withMarketPrice, withCex, withBM, withMM, lastScrapedAt: latest?.scrapedAt ?? null };
    }

    // ─── Utilities ────────────────────────────────────────────────────────────

    private extractFirstPrice(text: string): number | null {
        const m = text.match(/£\s*(\d+(?:\.\d{1,2})?)/);
        if (!m || !m[1]) return null;
        const val = parseFloat(m[1]);
        return isNaN(val) ? null : val;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { chromium } from 'playwright';
import type { BrowserContext } from 'playwright';

// These are used inside page.evaluate() which runs in browser context — not Node.js globals
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
    envirofone: number | null;
}

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    constructor(private readonly prisma: PrismaService) {}

    async runScraper(limit?: number): Promise<Record<string, DevicePrices>> {
        this.logger.log('Starting competitor price scraper…');

        // Mark ALL stuck RUNNING runs as FAILED before starting.
        // If we're here, any previous run must have crashed — safe to override.
        const { count: stuckCount } = await this.prisma.scraperRun.updateMany({
            where: { status: 'RUNNING' },
            data:  { status: 'FAILED', finishedAt: new Date(), errorMessage: 'Run timed out — marked failed automatically' },
        });
        if (stuckCount > 0) this.logger.warn(`Marked ${stuckCount} stuck run(s) as FAILED.`);

        const run = await this.prisma.scraperRun.create({
            data: { status: 'RUNNING' },
        });

        const devices = await this.prisma.deviceCatalog.findMany({
            where:   { isActive: true },
            include: { brandCategory: { include: { brand: true } } },
        });
        this.logger.log(`Found ${devices.length} active devices in catalog.`);

        const searchItems: { brand: string; model: string; storage: string; fullName: string }[] = [];
        for (const dev of devices) {
            const brandName = dev.brandCategory.brand.name;
            const options = dev.storageOptions?.length ? dev.storageOptions : [''];
            for (const storage of options) {
                searchItems.push({
                    brand:    brandName,
                    model:    dev.model,
                    storage:  storage as string,
                    fullName: storage ? `${brandName} ${dev.model} ${storage}` : `${brandName} ${dev.model}`,
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
                this.logger.log(`>> [${i + 1}/${itemsToScrape.length}] ${item.fullName}`);

                // CeX via Algolia interception
                let cex = await this.scrapeCeX(context, item.brand, item.model, item.storage);
                // Fallback: retry without storage for devices CeX lists differently (e.g. MacBooks)
                if (!cex && item.storage) {
                    this.logger.log(`   [..] CeX retry (no storage)...`);
                    await this.delay(500);
                    cex = await this.scrapeCeX(context, item.brand, item.model, '');
                }
                await this.delay(500);

                // BackMarket via Jina.ai (no browser needed)
                const backMarket = await this.scrapeBackMarket(item.fullName, item.storage);
                await this.delay(500);

                // MusicMagpie via Jina.ai
                const musicMagpie = await this.scrapeMusicMagpie(item.fullName, item.storage);
                await this.delay(500);

                // Envirofone via Jina.ai
                const envirofone = await this.scrapeEnvirofone(item.fullName, item.storage);

                results[item.fullName] = { cex, backMarket, musicMagpie, envirofone };

                const marketPrice = cex?.sellPrice ?? backMarket?.sellPrice ?? musicMagpie?.sellPrice ?? envirofone ?? null;

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
                        envirofonePrice:  envirofone,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        envirofonePrice:  envirofone,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                });

                const mktStr = marketPrice ? `£${marketPrice}` : 'no data';
                this.logger.log(`   $$ Market -> ${mktStr}`);
                this.logger.log('');

                if (i < itemsToScrape.length - 1) {
                    await this.delay(1000 + Math.random() * 1000);
                }
            }
        } catch (err: any) {
            await browser.close();
            await this.prisma.scraperRun.update({
                where: { id: run.id },
                data: { status: 'FAILED', finishedAt: new Date(), errorMessage: err?.message ?? 'Unknown error' },
            });
            this.logger.error(`Scraper failed: ${err?.message}`);
            throw err;
        }

        await browser.close();

        await this.prisma.scraperRun.update({
            where: { id: run.id },
            data: { status: 'COMPLETED', finishedAt: new Date(), totalScraped: itemsToScrape.length },
        });

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
                this.logger.log(`   [--] CeX  no result`);
                return null;
            }

            const modelL    = model.toLowerCase();
            const storageL  = storage?.toLowerCase() ?? '';
            // Normalize storage for matching: "128 GB" → "128gb" to match CeX's "128GB"
            const storageN  = storageL.replace(/\s+/g, '');
            // Normalize model: strip parentheses so "MacBook Air M2 (2022)" matches "MacBook Air M2 2022"
            const modelN    = modelL.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();

            // Score: +2 for storage match, +1 for "unlocked", -999 if model missing or variant mismatch
            const score = (h: any): number => {
                const name  = (h.boxName ?? '').toLowerCase();
                const nameN = name.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
                if (!nameN.includes(modelN)) return -999;
                // Only reject Pro Max / Plus / Ultra / Mini for iPhones —
                // these suffixes are valid for iPad Pro, MacBook Pro Max chip, etc.
                if (/iphone/i.test(modelL)) {
                    const afterModel = nameN.slice(nameN.indexOf(modelN) + modelN.length);
                    if (/^\s*(max|plus|ultra|mini)\b/i.test(afterModel)) return -999;
                }
                const nameNoSpace = name.replace(/\s+/g, '');
                return (storageN && nameNoSpace.includes(storageN) ? 2 : 0) + (name.includes('unlocked') ? 1 : 0);
            };

            const best = hits.reduce((a, b) => (score(b) > score(a) ? b : a), hits[0]);
            if (score(best) < 0) {
                this.logger.log(`   [--] CeX  no result`);
                return null;
            }

            // cashBuyPrice/exchangePrice are often 0; use the calculated variants which are always correct
            const cash     = best.cashPriceCalculated     || best.cashBuyPrice     || null;
            const exchange = best.exchangePriceCalculated || best.exchangePrice    || null;

            this.logger.log(`   [OK] CeX  £${best.sellPrice}  (cash £${cash ?? '—'} · px £${exchange ?? '—'})  "${best.boxName}"`);

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

    // ─── BackMarket (Jina.ai reader) ──────────────────────────────────────────────
    // Jina.ai renders the page server-side and returns clean text, bypassing Cloudflare.
    private async scrapeBackMarket(query: string, storage: string): Promise<CompetitorPrices | null> {
        try {
            const url = `https://www.backmarket.co.uk/en-gb/search?q=${encodeURIComponent(query)}`;
            const markdown = await this.fetchWithJina(url);
            const sellPrice = this.extractPriceFromMarkdown(markdown, storage);
            if (!sellPrice) {
                this.logger.log(`   [--] BackMarket  no result`);
                return null;
            }
            this.logger.log(`   [OK] BackMarket  £${sellPrice}`);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`BackMarket error for "${query}": ${e.message}`);
            return null;
        }
    }

    // ─── MusicMagpie (Jina.ai reader) ────────────────────────────────────────────
    private async scrapeMusicMagpie(query: string, storage: string): Promise<CompetitorPrices | null> {
        try {
            const url = `https://www.musicmagpie.co.uk/store/search?q=${encodeURIComponent(query)}`;
            const markdown = await this.fetchWithJina(url);
            const sellPrice = this.extractPriceFromMarkdown(markdown, storage);
            if (!sellPrice) {
                this.logger.log(`   [--] MusicMagpie  no result`);
                return null;
            }
            this.logger.log(`   [OK] MusicMagpie  £${sellPrice}`);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`MusicMagpie error for "${query}": ${e.message}`);
            return null;
        }
    }

    // ─── Envirofone (Jina.ai reader) ─────────────────────────────────────────────
    private async scrapeEnvirofone(query: string, storage: string): Promise<number | null> {
        try {
            const url = `https://www.envirofone.com/en/products/search/?q=${encodeURIComponent(query)}`;
            const markdown = await this.fetchWithJina(url);
            const price = this.extractPriceFromMarkdown(markdown, storage);
            if (!price) {
                this.logger.log(`   [--] Envirofone  no result`);
                return null;
            }
            this.logger.log(`   [OK] Envirofone  £${price}`);
            return price;
        } catch (e: any) {
            this.logger.error(`Envirofone error for "${query}": ${e.message}`);
            return null;
        }
    }

    // ─── Single-device scrape (for the "Re-scrape" button on catalog detail page) ─
    async scrapeDevice(brand: string, model: string): Promise<void> {
        this.logger.log(`Single-device scrape: ${brand} ${model}`);

        const device = await this.prisma.deviceCatalog.findFirst({
            where: {
                brandCategory: { brand: { name: { equals: brand, mode: 'insensitive' } } },
                model:         { equals: model, mode: 'insensitive' },
            },
            include: { brandCategory: { include: { brand: true } } },
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

                let cex = await this.scrapeCeX(context, brand, model, storage);
                if (!cex && storage) {
                    await this.delay(500);
                    cex = await this.scrapeCeX(context, brand, model, '');
                }
                await this.delay(500);
                const backMarket  = await this.scrapeBackMarket(fullName, storage);
                await this.delay(500);
                const musicMagpie = await this.scrapeMusicMagpie(fullName, storage);
                await this.delay(500);
                const envirofone  = await this.scrapeEnvirofone(fullName, storage);

                const marketPrice = cex?.sellPrice ?? backMarket?.sellPrice ?? musicMagpie?.sellPrice ?? envirofone ?? null;

                await this.prisma.scrapedPrice.upsert({
                    where:  { deviceKey: fullName },
                    create: {
                        deviceKey: fullName, brand, model, storage,
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        envirofonePrice:  envirofone,
                        marketPrice, scrapedAt: new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket?.sellPrice  ?? null,
                        musicMagpiePrice: musicMagpie?.sellPrice ?? null,
                        envirofonePrice:  envirofone,
                        marketPrice, scrapedAt: new Date(),
                    },
                });

                this.logger.log(`  └─ CeX=£${cex?.sellPrice ?? '—'}  BM=£${backMarket?.sellPrice ?? '—'}  EF=£${envirofone ?? '—'}  → market=£${marketPrice ?? '—'}`);
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

    private delay(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }

    // ─── Jina.ai Reader ───────────────────────────────────────────────────────────
    // Fetches a URL via r.jina.ai which renders the page server-side and returns
    // clean plain text — bypasses Cloudflare without needing a headless browser.
    private async fetchWithJina(targetUrl: string): Promise<string> {
        const jinaUrl = `https://r.jina.ai/${targetUrl}`;
        const headers: Record<string, string> = {
            'Accept': 'text/plain',
            'X-Timeout': '30',
        };
        const apiKey = process.env.JINA_API_KEY;
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch(jinaUrl, { headers, signal: AbortSignal.timeout(35_000) });
        if (!res.ok) throw new Error(`Jina.ai returned HTTP ${res.status}`);
        return res.text();
    }

    // Extracts the first £NNN price from Jina.ai markdown output.
    // Prefers a price within 3 lines of a storage mention (e.g. "128GB"),
    // since product name and price are often on adjacent lines in markdown.
    private extractPriceFromMarkdown(markdown: string, storage: string): number | null {
        const lines    = markdown.split('\n');
        const storageN = storage.toLowerCase().replace(/\s+/g, '');

        // Pass 1: find a line mentioning the storage variant, then look up to
        // 3 lines ahead for a price — handles heading + price on next line patterns.
        if (storageN) {
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].toLowerCase().replace(/\s+/g, '').includes(storageN)) continue;
                for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
                    const m = lines[j].match(/£\s*(\d+(?:\.\d{1,2})?)/);
                    if (m) return parseFloat(m[1]);
                }
            }
        }

        // Pass 2: first price on any line, ignoring trivial values like £1
        for (const line of lines) {
            const m = line.match(/£\s*(\d+(?:\.\d{1,2})?)/);
            if (m) {
                const val = parseFloat(m[1]);
                if (val > 1) return val;
            }
        }

        return null;
    }
}

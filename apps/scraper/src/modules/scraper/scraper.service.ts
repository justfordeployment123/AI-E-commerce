import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
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
    backMarket: JinaResult;
    musicMagpie: JinaResult;
    envirofone: JinaResult;
}

type Reason = 'ok' | 'not-found' | 'timeout' | 'error' | 'rate-limit';
interface JinaResult { price: number | null; reason: Reason; }

@Injectable()
export class ScraperService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ScraperService.name);
    private stopRequested = false;

    constructor(private readonly prisma: PrismaService) {}

    /** Signal the running scraper to stop after the current device finishes. */
    async stop(): Promise<{ stopped: boolean }> {
        if (this.stopRequested) return { stopped: false };
        this.stopRequested = true;
        this.logger.log('Stop requested — will halt after current device completes.');
        return { stopped: true };
    }

    // ─── Startup: resume any interrupted run ──────────────────────────────────
    async onApplicationBootstrap() {
        // Wait for DB connection to fully stabilise
        await this.delay(3000);

        let stuckRun: { id: string; startedAt: Date } | null;
        try {
            stuckRun = await this.prisma.scraperRun.findFirst({
                where: { status: 'RUNNING' },
                orderBy: { startedAt: 'desc' },
            });
        } catch (error) {
            this.logger.warn(
                `Database unavailable at startup — skipping interrupted run check. ${error instanceof Error ? error.message : ''}`,
            );
            return;
        }

        if (!stuckRun) {
            this.logger.log('Startup check: no interrupted runs found.');
            return;
        }

        try {
            // Which devices were already written to the DB in this run?
            const alreadyDone = await this.prisma.scrapedPrice.findMany({
                where: { scrapedAt: { gte: stuckRun.startedAt } },
                select: { deviceKey: true },
            });
            const doneKeys = new Set(alreadyDone.map(r => r.deviceKey));

            this.logger.warn(
                `Startup: found interrupted run ${stuckRun.id} from ${stuckRun.startedAt.toISOString()}. ` +
                `${doneKeys.size} devices already done — resuming the rest.`,
            );

            // Mark the old run as failed with an explanatory message
            await this.prisma.scraperRun.update({
                where: { id: stuckRun.id },
                data: {
                    status: 'FAILED',
                    finishedAt: new Date(),
                    errorMessage: `Service restarted mid-run — ${doneKeys.size} devices were already scraped and will be skipped in the resumed run.`,
                },
            });

            // Fire the resume in the background (non-blocking)
            this.runScraper(undefined, doneKeys).catch(err => {
                this.logger.error(`Auto-resume after crash failed: ${err?.message}`);
            });
        } catch (error) {
            this.logger.warn(
                `Failed to resume interrupted run — ${error instanceof Error ? error.message : error}`,
            );
        }
    }

    async runScraper(limit?: number, skipKeys?: Set<string>): Promise<Record<string, DevicePrices>> {
        const isResume = skipKeys && skipKeys.size > 0;
        this.logger.log(isResume
            ? `Resuming scraper — skipping ${skipKeys!.size} already-done devices…`
            : 'Starting competitor price scraper…',
        );

        // Mark any OTHER stuck RUNNING runs as FAILED (but not if we're in a resume,
        // since we already handled the stuck run in onApplicationBootstrap).
        if (!isResume) {
            const { count: stuckCount } = await this.prisma.scraperRun.updateMany({
                where: { status: 'RUNNING' },
                data:  { status: 'FAILED', finishedAt: new Date(), errorMessage: 'Run timed out — marked failed automatically' },
            });
            if (stuckCount > 0) this.logger.warn(`Marked ${stuckCount} stuck run(s) as FAILED.`);
        }

        const run = await this.prisma.scraperRun.create({
            data: { status: 'RUNNING' },
        });

        const devices = await this.prisma.deviceCatalog.findMany({
            where:   { isActive: true },
            include: { brandCategory: { include: { brand: true } } },
        });
        this.logger.log(`Found ${devices.length} active devices in catalog.`);

        const searchItems: { brand: string; model: string; storage: string; fullName: string; cexOnly?: boolean }[] = [];
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

        // Also scrape active "other" products (accessories, games, cables, etc.) — CeX only
        const otherProducts = await this.prisma.product.findMany({
            where:   { otherBrandId: { not: null }, isActive: true },
            include: { otherBrand: true },
            orderBy: { name: 'asc' },
        });
        const seenOthers = new Set<string>();
        for (const p of otherProducts) {
            const brandName = p.otherBrand!.name;
            const key = `${brandName}|||${p.name}`;
            if (seenOthers.has(key)) continue;
            seenOthers.add(key);
            searchItems.push({
                brand:    brandName,
                model:    p.name,
                storage:  '',
                fullName: `${brandName} ${p.name}`,
                cexOnly:  true,
            });
        }
        if (seenOthers.size > 0) this.logger.log(`Added ${seenOthers.size} other products to scrape queue.`);

        // Skip devices already completed in the interrupted run (resume support)
        const filteredItems = skipKeys && skipKeys.size > 0
            ? searchItems.filter(item => !skipKeys.has(item.fullName))
            : searchItems;

        const itemsToScrape = limit && limit > 0 ? filteredItems.slice(0, limit) : filteredItems;
        this.logger.log(`Scraping ${itemsToScrape.length} device variants${isResume ? ` (${skipKeys!.size} skipped — already done)` : ''}.`);

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
        const total   = itemsToScrape.length;
        const startMs = Date.now();

        const ts  = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const bar = (done: number) => {
            const pct  = Math.round((done / total) * 100);
            const fill = Math.round((done / total) * 20);
            return `[${'='.repeat(fill)}${'-'.repeat(20 - fill)}] ${String(pct).padStart(3)}%`;
        };
        const p = (v: number | null) => v ? `£${v}` : '--';
        const SEP = '-'.repeat(80);

        const othersCount = itemsToScrape.filter(i => i.cexOnly).length;
        console.log(`\n${SEP}`);
        console.log(`  SCRAPER RUN STARTED`);
        console.log(`  Devices : ${total - othersCount} catalog variants + ${othersCount} other products = ${total} total${isResume ? `  (resume — ${skipKeys!.size} skipped)` : ''}`);
        console.log(`  Started : ${ts()}`);
        console.log(`${SEP}\n`);

        this.stopRequested = false; // reset before each run

        try {
            for (const [i, item] of itemsToScrape.entries()) {
                // Admin requested stop — halt cleanly between devices
                if (this.stopRequested) {
                    this.logger.log(`Stop requested — halting after ${i} of ${total} devices.`);
                    await browser.close();
                    await this.prisma.scraperRun.update({
                        where: { id: run.id },
                        data:  { status: 'FAILED', finishedAt: new Date(), errorMessage: `Stopped manually by admin after ${i} of ${total} devices.` },
                    });
                    this.stopRequested = false;
                    return results;
                }

                const num = `[${String(i + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}]`;

                let cex = await this.scrapeCeX(context, item.brand, item.model, item.storage);
                if (!cex && item.storage) {
                    await this.delay(500);
                    cex = await this.scrapeCeX(context, item.brand, item.model, '');
                }
                await this.delay(500);
                const ref = cex?.sellPrice ?? undefined;
                const SKIP: JinaResult = { price: null, reason: 'not-found' };
                const backMarket  = item.cexOnly ? SKIP : await this.scrapeBackMarket(context, item.fullName, item.storage, ref);
                await this.delay(500);
                const musicMagpie = item.cexOnly ? SKIP : await this.scrapeMusicMagpie(context, item.fullName, item.storage, ref);
                await this.delay(500);
                const envirofone  = item.cexOnly ? SKIP : await this.scrapeEnvirofone(item.brand, item.model, item.storage, ref);

                results[item.fullName] = { cex, backMarket, musicMagpie, envirofone };
                const marketPrice = cex?.sellPrice ?? backMarket.price ?? musicMagpie.price ?? envirofone.price ?? null;

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
                        backMarketPrice:  backMarket.price,
                        musicMagpiePrice: musicMagpie.price,
                        envirofonePrice:  envirofone.price,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket.price,
                        musicMagpiePrice: musicMagpie.price,
                        envirofonePrice:  envirofone.price,
                        marketPrice,
                        scrapedAt:        new Date(),
                    },
                });

                // Show price OR reason why it's missing
                const fmt = (r: JinaResult) => r.price ? `£${r.price}`.padEnd(8) : `(${r.reason})`.padEnd(8);
                const best = marketPrice ? `Best: £${marketPrice}` : 'Best: none';
                console.log(`[${ts()}]  ${num}  ${bar(i + 1)}  ${item.fullName}`);
                console.log(`  ==> CeX: ${p(cex?.sellPrice ?? null).padEnd(8)}  BM: ${fmt(backMarket)}  MM: ${fmt(musicMagpie)}  EF: ${fmt(envirofone)}  ${best}`);
                console.log('');

                if (i < total - 1) {
                    await this.delay(1000 + Math.random() * 1000);
                }
            }
        } catch (err: any) {
            await browser.close();
            await this.prisma.scraperRun.update({
                where: { id: run.id },
                data: { status: 'FAILED', finishedAt: new Date(), errorMessage: err?.message ?? 'Unknown error' },
            });
            console.error(`\n[${ts()}]  ERROR: Scraper run failed — ${err?.message}\n`);
            throw err;
        }

        await browser.close();

        const elapsed = Math.round((Date.now() - startMs) / 1000);
        const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

        await this.prisma.scraperRun.update({
            where: { id: run.id },
            data: { status: 'COMPLETED', finishedAt: new Date(), totalScraped: total },
        });

        console.log(`${SEP}`);
        console.log(`  COMPLETED`);
        console.log(`  Devices : ${total}/${total} done`);
        console.log(`  Duration: ${mins}m ${secs}s`);
        console.log(`${SEP}\n`);
        return results;
    }

    // ─── CeX (Playwright + Algolia interception) ──────────────────────────────
    // CeX loads search results from Algolia (search.webuy.io). By intercepting
    // that network response we get clean JSON with all prices — no HTML parsing.
    private async scrapeCeX(context: BrowserContext, brand: string, model: string, storage: string): Promise<CompetitorPrices | null> {
        // CeX uses "Plus" not "+": "Galaxy S24+" → "Galaxy S24 Plus"
        const normModel = model.replace(/\+/g, 'Plus');
        const query = [brand, normModel, storage].filter(Boolean).join(' ');
        const page = await context.newPage();
        try {
            // Helper: navigate and capture the Algolia JSON response
            const fetchHits = async (q: string): Promise<any[]> => {
                const promise = page.waitForResponse(
                    r => r.url().includes('search.webuy.io') && r.status() === 200,
                    { timeout: 28_000 },
                );
                await page.goto(
                    `https://uk.webuy.com/search?stext=${encodeURIComponent(q)}`,
                    { waitUntil: 'domcontentloaded', timeout: 32_000 },
                );
                const json = await (await promise).json() as { results?: { hits?: any[] }[] };
                return json?.results?.[0]?.hits ?? [];
            };

            let hits = await fetchHits(query);

            // Retry with a simplified query when Algolia returns nothing.
            // Strips words CeX commonly omits: connectivity ("5G","4G"), "Edition", "Wireless".
            if (hits.length === 0) {
                const simplified = normModel
                    .replace(/\b5g\b|\b4g\b|\blte\b/gi, '')
                    .replace(/\bedition\b/gi, '')
                    .replace(/\bwireless\b/gi, '')
                    .replace(/\s+/g, ' ').trim();
                if (simplified !== normModel) {
                    hits = await fetchHits([brand, simplified, storage].filter(Boolean).join(' '));
                }
            }

            if (hits.length === 0) return null;

            // ── Matching ───────────────────────────────────────────────────────
            const modelL  = model.toLowerCase();
            const storageN = (storage ?? '').toLowerCase().replace(/\s+/g, '');

            // Normalize model: strip parens, "+" → "plus", collapse spaces
            const modelN = modelL
                .replace(/\+/g, 'plus')
                .replace(/[()]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            // Words CeX sometimes omits (treat as optional in matching)
            const OPTIONAL = new Set(['5g', '4g', 'lte', 'wireless', 'edition']);

            // Words that differentiate product tiers — reject a CeX result that
            // has one of these UNLESS our model also contains it.
            const TIER_WORDS = new Set(['ultra', 'plus', 'max', 'mini', 'lite', 'fe', 'air', 'slim', 'pro']);

            const modelWords    = modelN.split(/\s+/).filter(w => w.length > 1);
            const requiredWords = modelWords.filter(w => !OPTIONAL.has(w));
            const modelWordSet  = new Set(modelWords);

            const score = (h: any): number => {
                const raw   = (h.boxName ?? '').toLowerCase();
                const nameN = raw.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
                const nameWords = new Set(nameN.split(/\s+/));

                // Every required word must appear somewhere in the CeX name
                if (!requiredWords.every(w => nameN.includes(w))) return -999;

                // Reject if CeX name has a tier-differentiating word we didn't search for
                // e.g. searching "Galaxy S21" must not match "Galaxy S21 Ultra"
                const unexpectedTier = [...TIER_WORDS].some(t => nameWords.has(t) && !modelWordSet.has(t));
                if (unexpectedTier) return -999;

                const nameFlat = raw.replace(/\s+/g, '');
                return (storageN && nameFlat.includes(storageN) ? 2 : 0)
                     + (raw.includes('unlocked') ? 1 : 0);
            };

            const best = hits.reduce((a, b) => (score(b) > score(a) ? b : a), hits[0]);
            if (score(best) < 0) return null;

            const cash     = best.cashPriceCalculated     || best.cashBuyPrice     || null;
            const exchange = best.exchangePriceCalculated || best.exchangePrice    || null;

            return {
                sellPrice:        typeof best.sellPrice === 'number' && best.sellPrice > 0 ? best.sellPrice : null,
                buyCashPrice:     typeof cash           === 'number' && cash > 0           ? cash           : null,
                buyExchangePrice: typeof exchange       === 'number' && exchange > 0       ? exchange       : null,
            };
        } catch (e: any) {
            this.logger.error(`CeX error for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    // ─── BackMarket ───────────────────────────────────────────────────────────────
    // Blocked by Cloudflare on both Jina.ai (403) and headless Playwright.
    // Kept as a stub so the call site compiles; returns 'blocked' immediately.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async scrapeBackMarket(_context: BrowserContext, _query: string, _storage: string, _cexPrice?: number): Promise<JinaResult> {
        return { price: null, reason: 'error' };
    }

    // ─── MusicMagpie ──────────────────────────────────────────────────────────────
    // Their prices are JS-rendered. Playwright navigates their search page but
    // the first £ price found is a "next day delivery £1.09" fee — not a product price.
    // Disabled until a reliable extraction strategy is found.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async scrapeMusicMagpie(_context: BrowserContext, _query: string, _storage: string, _cexPrice?: number): Promise<JinaResult> {
        return { price: null, reason: 'not-found' };
    }

    // ─── Envirofone (Jina.ai) ─────────────────────────────────────────────────────
    // Envirofone product pages render server-side — Jina works fine.
    // URL pattern: /en-gb/buy/products/{model-slug}
    // e.g. "Apple iPhone 14 Pro Max" → iphone-14-pro-max
    private async scrapeEnvirofone(brand: string, model: string, storage: string, cexPrice?: number): Promise<JinaResult> {
        try {
            const slug = this.envirofoneSlug(brand, model);
            if (!slug) return { price: null, reason: 'not-found' };
            const url = `https://www.envirofone.com/en-gb/buy/products/${slug}`;
            const markdown = await this.fetchWithJina(url);
            if (markdown.includes('404') || markdown.includes('Page not found')) return { price: null, reason: 'not-found' };
            if (markdown.includes('429') || markdown.includes('Too Many Requests')) return { price: null, reason: 'rate-limit' };
            const price = this.extractPriceFromMarkdown(markdown, storage, cexPrice);
            return price ? { price, reason: 'ok' } : { price: null, reason: 'not-found' };
        } catch (e: any) {
            const reason: Reason = e.name === 'TimeoutError' || e.message?.includes('timeout') ? 'timeout' : 'error';
            this.logger.error(`Envirofone (${reason}) for "${brand} ${model}": ${e.message}`);
            return { price: null, reason };
        }
    }

    // Convert brand + model name to Envirofone URL slug
    // "Apple" + "iPhone 14 Pro Max" → "iphone-14-pro-max"
    // "Samsung" + "Galaxy S24 Ultra" → "samsung-galaxy-s24-ultra"
    private envirofoneSlug(brand: string, model: string): string | null {
        const full = `${brand} ${model}`.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        // Apple iPhones: strip "apple-" prefix since Envirofone uses "iphone-14" not "apple-iphone-14"
        if (brand.toLowerCase() === 'apple' && model.toLowerCase().startsWith('iphone')) {
            return full.replace(/^apple-/, '');
        }
        // iPads: same pattern
        if (brand.toLowerCase() === 'apple' && model.toLowerCase().startsWith('ipad')) {
            return full.replace(/^apple-/, '');
        }
        // MacBooks: same
        if (brand.toLowerCase() === 'apple' && model.toLowerCase().startsWith('macbook')) {
            return full.replace(/^apple-/, '');
        }
        // Samsung, Google, Sony etc: keep full slug "samsung-galaxy-s24"
        return full;
    }

    // ─── Single-device scrape (for the "Re-scrape" button on catalog detail page) ─
    async scrapeDevice(brand: string, model: string): Promise<void> {
        this.logger.log(`----  Single scrape: ${brand} ${model}  ----`);

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
                this.logger.log(`  → ${fullName}`);

                let cex = await this.scrapeCeX(context, brand, model, storage);
                if (!cex && storage) {
                    await this.delay(500);
                    cex = await this.scrapeCeX(context, brand, model, '');
                }
                await this.delay(500);
                const ref2 = cex?.sellPrice ?? undefined;
                const backMarket  = await this.scrapeBackMarket(context, fullName, storage, ref2);
                await this.delay(500);
                const musicMagpie = await this.scrapeMusicMagpie(context, fullName, storage, ref2);
                await this.delay(500);
                const envirofone  = await this.scrapeEnvirofone(brand, model, storage, ref2);

                const marketPrice = cex?.sellPrice ?? backMarket.price ?? musicMagpie.price ?? envirofone.price ?? null;

                await this.prisma.scrapedPrice.upsert({
                    where:  { deviceKey: fullName },
                    create: {
                        deviceKey: fullName, brand, model, storage,
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket.price,
                        musicMagpiePrice: musicMagpie.price,
                        envirofonePrice:  envirofone.price,
                        marketPrice, scrapedAt: new Date(),
                    },
                    update: {
                        cexSellPrice:     cex?.sellPrice        ?? null,
                        cexCashPrice:     cex?.buyCashPrice     ?? null,
                        cexExchangePrice: cex?.buyExchangePrice ?? null,
                        backMarketPrice:  backMarket.price,
                        musicMagpiePrice: musicMagpie.price,
                        envirofonePrice:  envirofone.price,
                        marketPrice, scrapedAt: new Date(),
                    },
                });

                const fmtJ = (r: JinaResult) => r.price ? `£${r.price}` : `(${r.reason})`;
                const fmtN = (v: number | null) => v ? `£${v}` : '--';
                this.logger.log(`     CeX:${fmtN(cex?.sellPrice ?? null)}  BM:${fmtJ(backMarket)}  MM:${fmtJ(musicMagpie)}  EF:${fmtJ(envirofone)}  Best:${marketPrice ? `£${marketPrice}` : 'none'}`);
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
        const [total, withMarketPrice, withCex, withBM, withMM, withEF, latest] = await Promise.all([
            this.prisma.scrapedPrice.count(),
            this.prisma.scrapedPrice.count({ where: { marketPrice:      { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { cexSellPrice:     { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { backMarketPrice:  { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { musicMagpiePrice: { not: null } } }),
            this.prisma.scrapedPrice.count({ where: { envirofonePrice:  { not: null } } }),
            this.prisma.scrapedPrice.findFirst({ orderBy: { scrapedAt: 'desc' }, select: { scrapedAt: true } }),
        ]);
        return { total, withMarketPrice, withCex, withBM, withMM, withEnvirofone: withEF, lastScrapedAt: latest?.scrapedAt ?? null };
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
    private extractPriceFromMarkdown(markdown: string, storage: string, referencePrice?: number): number | null {
        const lines    = markdown.split('\n');
        const storageN = storage.toLowerCase().replace(/\s+/g, '');

        // If we have a CeX reference price, only accept prices within 20%–300% of it.
        // This kills bogus extractions like £700 for an iPhone 11 (CeX: £180).
        const sane = (val: number): boolean => {
            if (val < 10) return false; // rejects delivery fees, promo codes, £1.09 etc.
            if (!referencePrice) return true;
            return val >= referencePrice * 0.20 && val <= referencePrice * 3.0;
        };

        // Pass 1: find a line mentioning the storage variant, then look up to
        // 3 lines ahead for a price — handles heading + price on next line patterns.
        if (storageN) {
            for (let i = 0; i < lines.length; i++) {
                if (!lines[i].toLowerCase().replace(/\s+/g, '').includes(storageN)) continue;
                for (let j = i; j <= Math.min(i + 3, lines.length - 1); j++) {
                    const m = lines[j].match(/£\s*(\d+(?:\.\d{1,2})?)/);
                    if (m) {
                        const val = parseFloat(m[1]);
                        if (sane(val)) return val;
                    }
                }
            }
        }

        // Pass 2: first price on any line that passes the sanity check
        for (const line of lines) {
            const m = line.match(/£\s*(\d+(?:\.\d{1,2})?)/);
            if (m) {
                const val = parseFloat(m[1]);
                if (sane(val)) return val;
            }
        }

        return null;
    }

}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ScraperDataService {
    private readonly logger = new Logger(ScraperDataService.name);

    constructor(private readonly prisma: PrismaService) {}

    async listPrices(page = 1, limit = 50, search?: string) {
        const skip = (page - 1) * limit;
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

    async cleanupStuckRuns(force = false): Promise<{ cleaned: number }> {
        const where = force
            ? { status: 'RUNNING' as const }
            : { status: 'RUNNING' as const, startedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } };
        const result = await this.prisma.scraperRun.updateMany({
            where,
            data: { status: 'FAILED', finishedAt: new Date(), errorMessage: force ? 'Scraper service offline — run marked failed automatically' : 'Marked failed manually via admin cleanup' },
        });
        this.logger.log(`Cleaned up ${result.count} stuck run(s) (force=${force}).`);
        return { cleaned: result.count };
    }

    async getRuns(limit = 20) {
        const runs = await this.prisma.scraperRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
        });

        const running = runs.find(r => r.status === 'RUNNING');
        if (!running) return runs.map(r => ({ ...r, currentProgress: null as number | null, totalVariants: null as number | null }));

        // Count catalog variants (sum of storageOptions per active device)
        const catalogDevices = await this.prisma.deviceCatalog.findMany({
            where:  { isActive: true },
            select: { storageOptions: true },
        });
        const totalCatalog = catalogDevices.reduce(
            (sum, d) => sum + Math.max((d.storageOptions as string[]).length, 1),
            0,
        );

        // Build the set of "other" deviceKeys (brand + name, same format as scraper)
        const otherProducts = await this.prisma.product.findMany({
            where:  { otherBrandId: { not: null }, isActive: true },
            select: { name: true, otherBrand: { select: { name: true } } },
        });
        const otherDeviceKeys = [...new Set(
            otherProducts.map(p => `${p.otherBrand!.name} ${p.name}`)
        )];
        const totalOthers = otherDeviceKeys.length;
        const totalVariants = totalCatalog + totalOthers;

        // Split progress: rows written since run start, partitioned by type
        const since = running.startedAt;
        const [catalogProgress, othersProgress] = await Promise.all([
            this.prisma.scrapedPrice.count({
                where: { scrapedAt: { gte: since }, deviceKey: { notIn: otherDeviceKeys } },
            }),
            this.prisma.scrapedPrice.count({
                where: { scrapedAt: { gte: since }, deviceKey: { in: otherDeviceKeys } },
            }),
        ]);

        return runs.map(r => ({
            ...r,
            currentProgress:  r.id === running.id ? catalogProgress + othersProgress : null,
            totalVariants:    r.id === running.id ? totalVariants    : null,
            totalCatalog:     r.id === running.id ? totalCatalog     : null,
            totalOthers:      r.id === running.id ? totalOthers      : null,
            catalogProgress:  r.id === running.id ? catalogProgress  : null,
            othersProgress:   r.id === running.id ? othersProgress   : null,
        }));
    }

    async triggerScraper() {
        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        try {
            // Await just the initial HTTP handshake — if scraper is down this throws immediately.
            // The scraper responds 202 and runs in the background, so we don't wait for scraping to finish.
            const res = await fetch(`${scraperUrl}/scraper/run`, {
                method: 'POST',
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) {
                // Service responded but returned an error — force-clean any stuck runs
                await this.cleanupStuckRuns(true);
                return { ok: false, message: `Scraper service returned ${res.status}. Check scraper logs.` };
            }
            return { ok: true, message: 'Scraper started in the background.' };
        } catch (err: any) {
            const isTimeout = err?.name === 'TimeoutError';
            // Service is offline — force-clean stuck RUNNING records so the UI isn't blocked
            const { cleaned } = await this.cleanupStuckRuns(true);
            const clearedNote = cleaned > 0 ? ` ${cleaned} stuck run${cleaned !== 1 ? 's' : ''} cleared.` : '';
            const msg = isTimeout
                ? `Scraper service did not respond. It may be starting up — try again in a moment.${clearedNote}`
                : `Scraper service is offline. Make sure the scraper container is running.${clearedNote}`;
            this.logger.error(`Failed to trigger scraper: ${err?.message}`);
            return { ok: false, message: msg };
        }
    }

    async lookupPrice(brand: string, model: string, storage?: string): Promise<number | null> {
        const rows = await this.prisma.scrapedPrice.findMany({
            where: {
                brand: { equals: brand, mode: 'insensitive' },
                model: { equals: model, mode: 'insensitive' },
                ...(storage ? { storage: { equals: storage, mode: 'insensitive' } } : {}),
            },
            orderBy: { scrapedAt: 'desc' },
            take: 1,
        });
        return rows[0]?.marketPrice ?? null;
    }

    async stopScraper() {
        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        try {
            const res = await fetch(`${scraperUrl}/scraper/stop`, {
                method: 'POST',
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) return { ok: false, message: `Scraper returned ${res.status}.` };
            return { ok: true, message: 'Stop signal sent — scraper will halt after the current device.' };
        } catch (err: any) {
            this.logger.error(`Failed to stop scraper: ${err?.message}`);
            return { ok: false, message: 'Scraper service is unreachable.' };
        }
    }

    async triggerDeviceScrape(brand: string, model: string) {
        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        try {
            const res = await fetch(
                `${scraperUrl}/scraper/device?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`,
                { method: 'POST', signal: AbortSignal.timeout(5000) },
            );
            if (!res.ok) return { ok: false, message: `Scraper service returned ${res.status}.` };
            return { ok: true, message: `Scraping ${brand} ${model} in the background.` };
        } catch (err: any) {
            this.logger.error(`Failed to trigger device scrape: ${err?.message}`);
            return { ok: false, message: 'Scraper service is unreachable.' };
        }
    }

    async triggerDeviceScrapeSync(brand: string, model: string): Promise<{ ok: boolean; prices?: any[]; message?: string }> {
        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        try {
            const res = await fetch(
                `${scraperUrl}/scraper/device?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&sync=true`,
                { method: 'POST', signal: AbortSignal.timeout(120_000) },
            );
            if (!res.ok) return { ok: false, message: `Scraper service returned ${res.status}.` };
            const data = await res.json() as { prices?: any[] };
            return { ok: true, prices: data.prices };
        } catch (err: any) {
            const isTimeout = err?.name === 'TimeoutError';
            const msg = isTimeout
                ? 'Scraper timed out — it may still be running in the background.'
                : 'Scraper service is unreachable.';
            this.logger.error(`Failed to trigger sync device scrape: ${err?.message}`);
            return { ok: false, message: msg };
        }
    }
}

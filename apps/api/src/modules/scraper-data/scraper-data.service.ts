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

    async cleanupStuckRuns(): Promise<{ cleaned: number }> {
        const twoHoursAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
        const result = await this.prisma.scraperRun.updateMany({
            where: { status: 'RUNNING', startedAt: { lt: twoHoursAgo } },
            data:  { status: 'FAILED', finishedAt: new Date(), errorMessage: 'Marked failed manually via admin cleanup' },
        });
        this.logger.log(`Cleaned up ${result.count} stuck run(s).`);
        return { cleaned: result.count };
    }

    async getRuns(limit = 20) {
        return this.prisma.scraperRun.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
        });
    }

    async triggerScraper() {
        const scraperUrl = process.env.SCRAPER_URL;
        if (!scraperUrl) {
            this.logger.warn('SCRAPER_URL not set — cannot trigger scraper manually.');
            return { ok: false, message: 'Scraper service is not configured. Set SCRAPER_URL in the API environment.' };
        }
        try {
            // Await just the initial HTTP handshake — if scraper is down this throws immediately.
            // The scraper responds 202 and runs in the background, so we don't wait for scraping to finish.
            const res = await fetch(`${scraperUrl}/scraper/run`, {
                method: 'POST',
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) {
                return { ok: false, message: `Scraper service returned ${res.status}. Check scraper logs.` };
            }
            return { ok: true, message: 'Scraper started in the background.' };
        } catch (err: any) {
            const isTimeout = err?.name === 'TimeoutError';
            const msg = isTimeout
                ? 'Scraper service did not respond in time. It may be starting up — try again in a moment.'
                : 'Scraper service is unreachable. Make sure the scraper container is running.';
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

    async triggerDeviceScrape(brand: string, model: string) {
        const scraperUrl = process.env.SCRAPER_URL;
        if (!scraperUrl) return { ok: false, message: 'Scraper service is not configured.' };
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
}

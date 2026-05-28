import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScraperCronService {
    private readonly logger = new Logger(ScraperCronService.name);

    // Runs every hour at minute 0 (1:00, 2:00, 3:00 …)
    @Cron('0 * * * *')
    async triggerScraper() {
        const scraperUrl = process.env.SCRAPER_URL;

        if (!scraperUrl) {
            this.logger.warn('SCRAPER_URL is not set — skipping scheduled scrape.');
            return;
        }

        this.logger.log('Triggering scraper service (fire and forget)…');

        // Fire and forget — scraper updates the DB directly, we don't wait
        fetch(`${scraperUrl}/scraper/run`, { method: 'POST' }).catch(err => {
            this.logger.error(`Failed to trigger scraper: ${err?.message}`);
        });
    }
}

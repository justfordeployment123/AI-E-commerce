import { Controller, Post, Get, Query, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Post('run')
    @HttpCode(HttpStatus.ACCEPTED)
    async runScraper(@Query('sync') sync?: string): Promise<any> {
        const isSync = sync === 'true';

        if (isSync) {
            const results = await this.scraperService.runScraper();
            return {
                message: 'Scraper execution finished (synchronous).',
                results,
            };
        } else {
            // Run asynchronously in the background
            this.scraperService.runScraper().catch((err) => {
                console.error('Background scraper run failed:', err);
            });

            return {
                message: 'Scraper execution started in the background.',
            };
        }
    }

    @Get('latest')
    getLatestPrices() {
        const outputPath = path.join(process.cwd(), 'prisma', 'downloads', 'scraped_prices.json');
        
        if (!fs.existsSync(outputPath)) {
            throw new NotFoundException('No scraped prices found. Please run the scraper first.');
        }

        try {
            const rawData = fs.readFileSync(outputPath, 'utf-8');
            return JSON.parse(rawData);
        } catch (e: any) {
            throw new NotFoundException(`Failed to read scraped prices: ${e.message}`);
        }
    }
}

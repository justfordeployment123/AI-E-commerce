import { Controller, Post, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('scraper')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) {}

    @Post('run')
    @HttpCode(HttpStatus.ACCEPTED)
    async runScraper(@Query('sync') sync?: string, @Query('limit') limit?: string): Promise<any> {
        const isSync = sync === 'true';
        const limitNum = limit ? Number(limit) : undefined;

        if (isSync) {
            const results = await this.scraperService.runScraper(limitNum);
            return { message: 'Scraper finished (synchronous).', results };
        }

        this.scraperService.runScraper(limitNum).catch(err => {
            console.error('Background scraper failed:', err);
        });
        return { message: 'Scraper started in the background.' };
    }

    @Get('prices')
    listPrices(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.scraperService.listPrices(
            page ? Number(page) : 1,
            limit ? Number(limit) : 50,
            search,
        );
    }

    @Get('device')
    getDevicePrices(@Query('brand') brand: string, @Query('model') model: string) {
        return this.scraperService.getDevicePrices(brand ?? '', model ?? '');
    }

    @Post('device')
    @HttpCode(HttpStatus.ACCEPTED)
    scrapeDevice(@Query('brand') brand: string, @Query('model') model: string) {
        this.scraperService.scrapeDevice(brand ?? '', model ?? '').catch(err => {
            console.error('Background device scrape failed:', err);
        });
        return { message: `Scraping ${brand} ${model} in the background.` };
    }

    @Get('stats')
    getStats() {
        return this.scraperService.getStats();
    }
}

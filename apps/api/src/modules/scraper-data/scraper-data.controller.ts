import { Controller, Post, Get, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ScraperDataService } from './scraper-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('scraper')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ScraperDataController {
    constructor(private readonly service: ScraperDataService) {}

    @Post('run')
    @HttpCode(HttpStatus.ACCEPTED)
    run() {
        return this.service.triggerScraper();
    }

    @Get('prices')
    prices(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.service.listPrices(page ? Number(page) : 1, limit ? Number(limit) : 50, search);
    }

    @Get('device')
    devicePrices(@Query('brand') brand: string, @Query('model') model: string) {
        return this.service.getDevicePrices(brand ?? '', model ?? '');
    }

    @Post('device')
    @HttpCode(HttpStatus.ACCEPTED)
    scrapeDevice(@Query('brand') brand: string, @Query('model') model: string) {
        return this.service.triggerDeviceScrape(brand ?? '', model ?? '');
    }

    @Get('stats')
    stats() {
        return this.service.getStats();
    }

    @Get('runs')
    runs(@Query('limit') limit?: string) {
        return this.service.getRuns(limit ? Number(limit) : 20);
    }

    @Post('cleanup')
    @HttpCode(HttpStatus.OK)
    cleanup() {
        return this.service.cleanupStuckRuns();
    }
}

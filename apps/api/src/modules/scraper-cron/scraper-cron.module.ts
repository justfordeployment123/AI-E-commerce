import { Module } from '@nestjs/common';
import { ScraperCronService } from './scraper-cron.service';

@Module({
    providers: [ScraperCronService],
})
export class ScraperCronModule {}

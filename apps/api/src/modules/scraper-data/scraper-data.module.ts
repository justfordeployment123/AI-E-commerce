import { Module } from '@nestjs/common';
import { ScraperDataService } from './scraper-data.service';
import { ScraperDataController } from './scraper-data.controller';

@Module({
    controllers: [ScraperDataController],
    providers: [ScraperDataService],
    exports: [ScraperDataService],
})
export class ScraperDataModule {}

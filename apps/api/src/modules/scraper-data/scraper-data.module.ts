import { Module, forwardRef } from '@nestjs/common';
import { ScraperDataService } from './scraper-data.service';
import { ScraperDataController } from './scraper-data.controller';
import { ScraperCronModule } from '../scraper-cron/scraper-cron.module';

@Module({
    imports:     [forwardRef(() => ScraperCronModule)],
    controllers: [ScraperDataController],
    providers:   [ScraperDataService],
    exports:     [ScraperDataService],
})
export class ScraperDataModule {}

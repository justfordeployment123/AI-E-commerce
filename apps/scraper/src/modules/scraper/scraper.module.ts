import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ProxyPoolService } from './proxy-pool.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ScraperController],
    providers: [ScraperService, ProxyPoolService],
})
export class ScraperModule {}

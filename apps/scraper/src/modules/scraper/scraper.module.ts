import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [ScraperController],
    providers: [ScraperService],
})
export class ScraperModule {}

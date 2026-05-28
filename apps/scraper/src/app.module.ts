import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ScraperModule } from './modules/scraper/scraper.module';

@Module({
    imports: [DatabaseModule, ScraperModule],
})
export class AppModule {}

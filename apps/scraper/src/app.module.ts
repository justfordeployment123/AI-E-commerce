import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ScraperModule } from './modules/scraper/scraper.module';

@Module({
    imports: [DatabaseModule, HealthModule, ScraperModule],
})
export class AppModule {}

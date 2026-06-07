import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { HealthController } from './modules/health/health.controller';

@Module({
    imports: [DatabaseModule, ScraperModule],
    controllers: [HealthController],
})
export class AppModule {}

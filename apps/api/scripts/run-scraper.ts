import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScraperService } from '../src/modules/scraper/scraper.service';

async function bootstrap() {
  console.log('Bootstrapping NestJS application context for scraping...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  
  try {
    const scraperService = app.get(ScraperService);
    await scraperService.runScraper();
    console.log('Scraper script execution finished.');
  } catch (error) {
    console.error('Error executing scraper script:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();

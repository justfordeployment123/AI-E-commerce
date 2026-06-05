import { Module, forwardRef } from '@nestjs/common';
import { ScraperCronService }   from './scraper-cron.service';
import { ProductPricingModule } from '../product-pricing/product-pricing.module';

@Module({
    imports:   [forwardRef(() => ProductPricingModule)],
    providers: [ScraperCronService],
    exports:   [ScraperCronService],
})
export class ScraperCronModule {}

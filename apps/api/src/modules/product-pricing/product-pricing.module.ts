import { Module } from '@nestjs/common';
import { ProductPricingService }    from './product-pricing.service';
import { ProductPricingController } from './product-pricing.controller';
import { ScraperDataModule }        from '../scraper-data/scraper-data.module';
import { PricingConfigModule }      from '../pricing-config/pricing-config.module';

@Module({
    imports:     [ScraperDataModule, PricingConfigModule],
    providers:   [ProductPricingService],
    controllers: [ProductPricingController],
    exports:     [ProductPricingService],
})
export class ProductPricingModule {}

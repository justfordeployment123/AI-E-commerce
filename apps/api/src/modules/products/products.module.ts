import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { ProductPricingModule } from '../product-pricing/product-pricing.module';

@Module({
    imports: [DatabaseModule, StorageModule, ProductPricingModule],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService],
})
export class ProductsModule {}

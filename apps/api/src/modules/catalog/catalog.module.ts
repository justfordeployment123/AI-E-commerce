import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CategoriesController, BrandsController, BrandCategoriesController } from './catalog.controller';
import { StorageModule } from '../../common/services/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [CategoriesController, BrandsController, BrandCategoriesController],
    providers: [CatalogService],
    exports: [CatalogService],
})
export class CatalogModule {}

import { Module } from '@nestjs/common';
import { OtherBrandsController, OtherSubcategoriesController } from './other-catalog.controller';
import { OtherCatalogService } from './other-catalog.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [OtherBrandsController, OtherSubcategoriesController],
    providers: [OtherCatalogService],
    exports: [OtherCatalogService],
})
export class OtherCatalogModule {}

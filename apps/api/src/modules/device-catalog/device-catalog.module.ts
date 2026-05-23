import { Module } from '@nestjs/common';
import { DeviceCatalogController } from './device-catalog.controller';
import { DeviceCatalogService } from './device-catalog.service';

@Module({
    controllers: [DeviceCatalogController],
    providers: [DeviceCatalogService],
    exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}

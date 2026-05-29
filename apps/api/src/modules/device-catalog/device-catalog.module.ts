import { Module } from '@nestjs/common';
import { DeviceCatalogController } from './device-catalog.controller';
import { DeviceCatalogService } from './device-catalog.service';
import { StorageModule } from '../../common/services/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [DeviceCatalogController],
    providers: [DeviceCatalogService],
    exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}

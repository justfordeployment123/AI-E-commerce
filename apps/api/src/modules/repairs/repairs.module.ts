import { Module } from '@nestjs/common';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
    imports: [DatabaseModule, StorageModule, NotificationsModule, ShippingModule],
    controllers: [RepairsController],
    providers: [RepairsService],
})
export class RepairsModule {}

import { Module } from '@nestjs/common';
import { RepairsController } from './repairs.controller';
import { RepairsService } from './repairs.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, StorageModule, NotificationsModule],
    controllers: [RepairsController],
    providers: [RepairsService],
})
export class RepairsModule {}

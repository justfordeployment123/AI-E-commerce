import { Module } from '@nestjs/common';
import { TradeInsController } from './trade-ins.controller';
import { TradeInsService } from './trade-ins.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, StorageModule, NotificationsModule],
    controllers: [TradeInsController],
    providers: [TradeInsService],
})
export class TradeInsModule {}

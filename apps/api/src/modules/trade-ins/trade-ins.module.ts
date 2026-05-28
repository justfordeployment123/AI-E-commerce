import { Module } from '@nestjs/common';
import { TradeInsController } from './trade-ins.controller';
import { TradeInsService } from './trade-ins.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShippingModule } from '../shipping/shipping.module';
import { ScraperDataModule } from '../scraper-data/scraper-data.module';

@Module({
    imports: [DatabaseModule, StorageModule, NotificationsModule, ShippingModule, ScraperDataModule],
    controllers: [TradeInsController],
    providers: [TradeInsService],
})
export class TradeInsModule {}

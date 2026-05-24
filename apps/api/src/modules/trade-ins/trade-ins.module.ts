import { Module } from '@nestjs/common';
import { TradeInsController } from './trade-ins.controller';
import { TradeInsService } from './trade-ins.service';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../../common/services/storage.module';

@Module({
    imports: [DatabaseModule, StorageModule],
    controllers: [TradeInsController],
    providers: [TradeInsService],
})
export class TradeInsModule {}

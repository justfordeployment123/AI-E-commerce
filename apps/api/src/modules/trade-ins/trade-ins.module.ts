import { Module } from '@nestjs/common';
import { TradeInsController } from './trade-ins.controller';
import { TradeInsService } from './trade-ins.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TradeInsController],
    providers: [TradeInsService],
})
export class TradeInsModule {}

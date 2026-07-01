import { Module } from '@nestjs/common';
import { TradeInDevicesController } from './trade-in-devices.controller';
import { TradeInDevicesService } from './trade-in-devices.service';

@Module({
    controllers: [TradeInDevicesController],
    providers: [TradeInDevicesService],
    exports: [TradeInDevicesService],
})
export class TradeInDevicesModule {}

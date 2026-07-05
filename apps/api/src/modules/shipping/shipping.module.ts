import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { EmailService } from '../../common/services/email.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports:     [DatabaseModule, SettingsModule],
    controllers: [ShippingController],
    providers:   [ShippingService, EmailService],
    exports:     [ShippingService],
})
export class ShippingModule {}

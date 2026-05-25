import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { EmailService } from '../../common/services/email.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports:   [DatabaseModule],
    providers: [ShippingService, EmailService],
    exports:   [ShippingService],
})
export class ShippingModule {}

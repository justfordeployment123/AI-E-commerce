import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shipping/shipping.module';
import { EmailModule } from '../../common/services/email.module';

@Module({
    imports: [PaymentsModule, ShippingModule, EmailModule],
    controllers: [HealthController],
    providers: [HealthService],
})
export class HealthModule { }

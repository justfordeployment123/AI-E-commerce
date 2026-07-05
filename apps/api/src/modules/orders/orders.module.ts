import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../../common/services/email.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [DatabaseModule, EmailModule, PaymentsModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}

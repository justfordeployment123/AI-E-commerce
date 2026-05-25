import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from '../../common/services/email.module';

@Module({
    imports: [DatabaseModule, EmailModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}

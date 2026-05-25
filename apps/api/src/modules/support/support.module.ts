import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { SupportController, AdminSupportController } from './support.controller';

@Module({
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportGateway],
  exports: [SupportService],
})
export class SupportModule {}

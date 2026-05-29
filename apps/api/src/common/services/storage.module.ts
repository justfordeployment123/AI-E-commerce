import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageProxyController } from './storage-proxy.controller';

@Module({
  controllers: [StorageProxyController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

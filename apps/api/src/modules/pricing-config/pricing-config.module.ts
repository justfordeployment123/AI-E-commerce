import { Module } from '@nestjs/common';
import { PricingConfigController } from './pricing-config.controller';
import { PricingConfigService } from './pricing-config.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [PricingConfigController],
    providers: [PricingConfigService],
    exports: [PricingConfigService],
})
export class PricingConfigModule {}

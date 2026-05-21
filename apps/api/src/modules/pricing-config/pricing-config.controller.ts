import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PricingConfigService } from './pricing-config.service';
import { UpsertPricingConfigDto } from './dto/upsert-pricing-config.dto';

@Controller('pricing-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PricingConfigController {
    constructor(private readonly pricingConfigService: PricingConfigService) {}

    @Get()
    findAll() {
        return this.pricingConfigService.findAll();
    }

    @Put(':key')
    upsert(@Param('key') key: string, @Body() dto: UpsertPricingConfigDto) {
        return this.pricingConfigService.upsert(key, dto);
    }

    @Delete(':key')
    remove(@Param('key') key: string) {
        return this.pricingConfigService.remove(key);
    }
}

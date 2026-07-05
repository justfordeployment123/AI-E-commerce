import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ShippingService } from './shipping.service';
import { ShippingSettingsDto } from './dto/shipping-settings.dto';

@Controller('shipping')
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) {}

    @Get('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    getSettings() {
        return this.shippingService.getSettings();
    }

    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updateSettings(@Body() dto: ShippingSettingsDto) {
        return this.shippingService.updateSettings(dto);
    }

    @Post('settings/test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    testConnection() {
        return this.shippingService.testConnection();
    }
}

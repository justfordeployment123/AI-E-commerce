import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('banners')
export class BannersController {
    constructor(private readonly banners: BannersService) {}

    // Public — web frontend fetches random banners
    @Get('random')
    getRandom(@Query('count') count?: string) {
        return this.banners.getRandom(count ? Math.min(Number(count), 10) : 4);
    }

    // Admin — list all banners with status
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    listAll() {
        return this.banners.listAll();
    }

    // Admin — toggle active state
    @Patch(':id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    toggle(@Param('id') id: string) {
        return this.banners.toggleActive(id);
    }
}

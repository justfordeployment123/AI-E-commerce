import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeviceCatalogService } from './device-catalog.service';
import { UpsertDeviceDto } from './dto/upsert-device.dto';

@Controller('device-catalog')
export class DeviceCatalogController {
    constructor(private readonly service: DeviceCatalogService) {}

    @Get()
    findAll(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('isActive') isActive?: string,
    ) {
        return this.service.findAll({
            category,
            search,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: UpsertDeviceDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<UpsertDeviceDto>) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}

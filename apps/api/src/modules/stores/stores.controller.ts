import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) {}

    // Public — used by the trade-in flow to show store picker
    @Get()
    findAll() {
        return this.storesService.findAllActive();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateStoreDto) {
        return this.storesService.create(dto);
    }

    @Get('all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findAllAdmin() {
        return this.storesService.findAll();
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
        return this.storesService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.storesService.remove(id);
    }
}

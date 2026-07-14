import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @UseGuards(OptionalJwtAuthGuard)
    create(@Body() dto: CreateOrderDto, @Request() req: { user?: { id: string } }) {
        return this.ordersService.create(dto, req.user?.id);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    findMine(@CurrentUser() user: { id: string }) {
        return this.ordersService.findByUser(user.id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findAll(
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.ordersService.findAll({
            status,
            search: search || undefined,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
        return this.ordersService.findByIdForUser(id, user);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.ordersService.update(id, dto);
    }

    @Post(':id/confirm')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    confirm(@Param('id') id: string) {
        return this.ordersService.confirm(id);
    }

    @Post(':id/ship')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    ship(@Param('id') id: string, @Body() dto: ShipOrderDto) {
        return this.ordersService.ship(id, dto);
    }

    @Post(':id/deliver')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deliver(@Param('id') id: string) {
        return this.ordersService.deliver(id);
    }

    @Post(':id/received')
    @UseGuards(JwtAuthGuard)
    markReceived(@Param('id') id: string, @CurrentUser() user: { id: string }) {
        return this.ordersService.markReceived(id, user.id);
    }

    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    cancel(@Param('id') id: string) {
        return this.ordersService.cancel(id);
    }

    @Delete('purge')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    purgeAll() {
        return this.ordersService.purgeAll();
    }
}

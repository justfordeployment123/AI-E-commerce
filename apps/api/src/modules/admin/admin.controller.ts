import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard')
    getDashboard() {
        return this.adminService.getDashboard();
    }

    @Get('analytics')
    getAnalytics() {
        return this.adminService.getAnalytics();
    }

    @Get('users')
    getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            search,
        });
    }
}

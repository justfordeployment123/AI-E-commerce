import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    getMe(@CurrentUser() user: { id: string }) {
        return this.usersService.findById(user.id);
    }

    @Patch('me')
    updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
        return this.usersService.update(user.id, dto);
    }

    @Patch('me/password')
    changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(user.id, dto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.usersService.findAll({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.usersService.findById(id);
    }
}

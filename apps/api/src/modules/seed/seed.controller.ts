import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SeedService } from './seed.service';

@Controller('admin/seed')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    @Post('run')
    run() {
        return this.seedService.runSeed();
    }
}

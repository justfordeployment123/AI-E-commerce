import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RepairsService } from './repairs.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { SetQuoteDto } from './dto/set-quote.dto';
import { CompleteRepairDto } from './dto/complete-repair.dto';

@Controller('repairs')
export class RepairsController {
    constructor(private readonly repairsService: RepairsService) {}

    @Post()
    submit(@Body() dto: CreateRepairDto, @Request() req: { user?: { id: string } }) {
        return this.repairsService.submit(dto, req.user?.id);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    findMine(@CurrentUser() user: { id: string }) {
        return this.repairsService.findByUser(user.id);
    }

    @Get('ref/:reference')
    findByRef(@Param('reference') reference: string) {
        return this.repairsService.findByReference(reference);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findAll(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.repairsService.findAll({
            status,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.repairsService.findById(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateRepairDto) {
        return this.repairsService.update(id, dto);
    }

    @Post(':id/quote')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    setQuote(@Param('id') id: string, @Body() dto: SetQuoteDto) {
        return this.repairsService.setQuote(id, dto);
    }

    @Post(':id/approve-quote')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    approveQuote(@Param('id') id: string) {
        return this.repairsService.approveQuote(id);
    }

    @Post(':id/start')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    startRepair(@Param('id') id: string) {
        return this.repairsService.startRepair(id);
    }

    @Post(':id/complete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    completeRepair(@Param('id') id: string, @Body() dto: CompleteRepairDto) {
        return this.repairsService.completeRepair(id, dto);
    }

    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    cancelRepair(@Param('id') id: string) {
        return this.repairsService.cancelRepair(id);
    }
}

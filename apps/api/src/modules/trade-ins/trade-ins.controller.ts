import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TradeInsService } from './trade-ins.service';
import { CreateTradeInDto } from './dto/create-trade-in.dto';
import { UpdateTradeInDto } from './dto/update-trade-in.dto';
import { ApproveTradeInDto } from './dto/approve-trade-in.dto';
import { RejectTradeInDto } from './dto/reject-trade-in.dto';
import { CounterOfferTradeInDto } from './dto/counter-offer-trade-in.dto';
import { AiPriceDto } from './dto/ai-price.dto';

@Controller('trade-ins')
export class TradeInsController {
    constructor(private readonly tradeInsService: TradeInsService) {}

    // Public – submit without account
    @Post()
    submit(@Body() dto: CreateTradeInDto, @Request() req: { user?: { id: string } }) {
        return this.tradeInsService.submit(dto, req.user?.id);
    }

    // Authenticated user – their own submissions
    @Get('my')
    @UseGuards(JwtAuthGuard)
    findMine(@CurrentUser() user: { id: string }) {
        return this.tradeInsService.findByUser(user.id);
    }

    // Public — AI-powered price estimate (uses OpenAI Vision if images provided)
    @Post('ai-price')
    aiPrice(@Body() dto: AiPriceDto) {
        return this.tradeInsService.aiPrice(dto);
    }

    // Public reference lookup (for confirmation page)
    @Get('ref/:reference')
    findByRef(@Param('reference') reference: string) {
        return this.tradeInsService.findByReference(reference);
    }

    // Admin routes
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findAll(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.tradeInsService.findAll({
            status,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.tradeInsService.findById(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: UpdateTradeInDto) {
        return this.tradeInsService.update(id, dto);
    }

    @Post(':id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    markUnderReview(@Param('id') id: string) {
        return this.tradeInsService.markUnderReview(id);
    }

    @Post(':id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    approve(@Param('id') id: string, @Body() dto: ApproveTradeInDto) {
        return this.tradeInsService.approve(id, dto);
    }

    @Post(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    reject(@Param('id') id: string, @Body() dto: RejectTradeInDto) {
        return this.tradeInsService.reject(id, dto);
    }

    @Post(':id/counter-offer')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    counterOffer(@Param('id') id: string, @Body() dto: CounterOfferTradeInDto) {
        return this.tradeInsService.counterOffer(id, dto);
    }

    @Post(':id/complete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    complete(@Param('id') id: string) {
        return this.tradeInsService.complete(id);
    }
}

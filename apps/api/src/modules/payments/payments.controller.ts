import {
    Body, Controller, Get, Headers, Post, Put,
    RawBodyRequest, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { PaymentSettingsDto } from './dto/payment-settings.dto';
import { RefundOrderDto } from './dto/refund-order.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('intent')
    createIntent(@Body() body: { items: { productId: string; quantity: number }[]; promoCode?: string }) {
        return this.paymentsService.createIntent(body.items ?? [], body.promoCode);
    }

    @Post('webhook')
    webhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') sig: string,
    ) {
        return this.paymentsService.handleWebhook(req.rawBody!, sig);
    }

    @Get('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    getSettings() {
        return this.paymentsService.getSettings();
    }

    @Put('settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updateSettings(@Body() dto: PaymentSettingsDto) {
        return this.paymentsService.updateSettings(dto);
    }

    @Post('settings/test')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    testConnection() {
        return this.paymentsService.testConnection();
    }

    @Post('refund')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    refund(@Body() dto: RefundOrderDto) {
        return this.paymentsService.refundOrder(dto.orderId, dto.amountPounds);
    }
}

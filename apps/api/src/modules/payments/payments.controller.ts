import { Body, Controller, Headers, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';

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
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');

const VALID_PROMO_CODES: Record<string, number> = {
    TECHSTOP10: 0.10,
};

@Injectable()
export class PaymentsService {
    private stripe: any = null;

    constructor(private readonly prisma: PrismaService) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (key) {
            this.stripe = new (StripeLib.default ?? StripeLib)(key, { apiVersion: '2024-06-20' });
        }
    }

    async createIntent(items: { productId: string; quantity: number }[], promoCode?: string) {
        const productIds = items.map(i => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('One or more products not found or unavailable');
        }

        let subtotal = 0;
        for (const item of items) {
            const product = products.find((p: any) => p.id === item.productId)!;
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for ${product.name}`);
            }
            subtotal += product.price * item.quantity;
        }

        const shipping = subtotal >= 100 ? 0 : 5.99;

        // Validate and apply promo discount server-side
        const discountRate = promoCode ? (VALID_PROMO_CODES[promoCode.toUpperCase()] ?? 0) : 0;
        const discount = Math.round(subtotal * discountRate * 100) / 100;
        const total = subtotal - discount + shipping;
        const amountPence = Math.round(total * 100);

        if (!this.stripe) {
            return { clientSecret: null, paymentIntentId: null, amount: total, discount, devMode: true };
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amountPence,
            currency: 'gbp',
            // Use card-only — avoids redirect-based payment methods that conflict
            // with confirmCardPayment when no return_url is set
            payment_method_types: ['card'],
            metadata: { promoCode: promoCode ?? '', discount: String(discount) },
        });

        return {
            clientSecret: paymentIntent.client_secret as string,
            paymentIntentId: paymentIntent.id as string,
            amount: total,
            discount,
            devMode: false,
        };
    }

    async handleWebhook(payload: Buffer, signature: string) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !this.stripe) return { received: true };

        let event: any;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, secret);
        } catch {
            throw new BadRequestException('Invalid webhook signature');
        }

        if (event.type === 'payment_intent.succeeded') {
            // Handled on the frontend after stripe.confirmCardPayment
        }

        return { received: true };
    }
}

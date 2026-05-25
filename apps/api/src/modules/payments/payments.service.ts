import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');
// Stripe v22 uses `export = StripeConstructor` — import the callable constructor
const StripeSDK: (key: string, opts: { apiVersion: string }) => any =
    typeof StripeLib === 'function' ? StripeLib : StripeLib.default ?? StripeLib;

@Injectable()
export class PaymentsService {
    private stripe: any = null;

    constructor(private readonly prisma: PrismaService) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (key) {
            this.stripe = new (StripeLib.default ?? StripeLib)(key, { apiVersion: '2024-06-20' });
        }
    }

    async createIntent(items: { productId: string; quantity: number }[]) {
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
        const total = subtotal + shipping;
        const amountPence = Math.round(total * 100);

        if (!this.stripe) {
            return { clientSecret: null, amount: total, devMode: true };
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: amountPence,
            currency: 'gbp',
            automatic_payment_methods: { enabled: true },
        });

        return { clientSecret: paymentIntent.client_secret as string, amount: total, devMode: false };
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

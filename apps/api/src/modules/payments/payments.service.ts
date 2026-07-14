import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../../common/services/email.service';
import { computeDiscount } from './promo-codes.constant';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly settingsService: SettingsService,
        private readonly emailService: EmailService,
    ) {}

    private async getMode(): Promise<string> {
        return (await this.settingsService.get('STRIPE_MODE')) ?? 'test';
    }

    private async getStripe(): Promise<any | null> {
        const mode = await this.getMode();
        const key =
            (await this.settingsService.get(`STRIPE_SECRET_KEY_${mode.toUpperCase()}`)) ??
            (await this.settingsService.get('STRIPE_SECRET_KEY'));
        if (!key) return null;
        return new (StripeLib.default ?? StripeLib)(key, { apiVersion: '2024-06-20' });
    }

    private async getWebhookSecret(): Promise<string | null> {
        const mode = await this.getMode();
        return (
            (await this.settingsService.get(`STRIPE_WEBHOOK_SECRET_${mode.toUpperCase()}`)) ??
            (await this.settingsService.get('STRIPE_WEBHOOK_SECRET'))
        );
    }

    /** Publishable key is not secret — it's meant to ship to the browser — so it's exposed
     *  unauthenticated for the storefront to initialize Stripe.js with the mode currently active. */
    async getPublicConfig(): Promise<{ mode: string; publishableKey: string | null }> {
        const mode = await this.getMode();
        const publishableKey = await this.settingsService.get(`STRIPE_PUBLISHABLE_KEY_${mode.toUpperCase()}`);
        return { mode, publishableKey };
    }

    /** Whether Stripe is actually configured for the active mode — used by orders.service.ts
     *  to decide whether a "dev" payment method is legitimately allowed, instead of trusting
     *  the client's own claim about devMode. */
    async isConfigured(): Promise<boolean> {
        return (await this.getStripe()) !== null;
    }

    /** Configuration snapshot for the health check — never exposes the keys themselves. */
    async getHealthStatus(): Promise<{
        configured: boolean;
        mode: string;
        keyMode: 'test' | 'live' | 'unknown';
        webhookConfigured: boolean;
        publishableKeyConfigured: boolean;
    }> {
        const mode = await this.getMode();
        const [key, webhookSecret, publishableKey] = await Promise.all([
            this.settingsService.get(`STRIPE_SECRET_KEY_${mode.toUpperCase()}`)
                .then(v => v ?? this.settingsService.get('STRIPE_SECRET_KEY')),
            this.getWebhookSecret(),
            this.settingsService.get(`STRIPE_PUBLISHABLE_KEY_${mode.toUpperCase()}`),
        ]);
        const keyMode = key?.startsWith('sk_live_') ? 'live' : key?.startsWith('sk_test_') ? 'test' : 'unknown';
        return {
            configured: Boolean(key),
            mode,
            keyMode,
            webhookConfigured: Boolean(webhookSecret),
            publishableKeyConfigured: Boolean(publishableKey),
        };
    }

    /** Confirms a PaymentIntent actually succeeded and matches the server-computed order
     *  total before an order is allowed to be created against it. */
    async verifyPayment(paymentIntentId: string, expectedAmountPence: number): Promise<void> {
        const stripe = await this.getStripe();
        if (!stripe) throw new BadRequestException('Stripe is not configured');

        let intent: any;
        try {
            intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch {
            throw new BadRequestException('Payment could not be verified');
        }

        if (intent.status !== 'succeeded') {
            throw new BadRequestException(`Payment has not succeeded (status: ${intent.status})`);
        }
        if (intent.currency !== 'gbp') {
            throw new BadRequestException('Unexpected payment currency');
        }
        if (intent.amount !== expectedAmountPence) {
            throw new BadRequestException('Payment amount does not match order total');
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
            subtotal += (product.price ?? 0) * item.quantity;
        }

        const shipping = subtotal >= 100 ? 0 : 5.99;

        const discount = computeDiscount(subtotal, promoCode);
        const total = subtotal - discount + shipping;
        const amountPence = Math.round(total * 100);

        const stripe = await this.getStripe();
        if (!stripe) {
            return { clientSecret: null, paymentIntentId: null, amount: total, discount, devMode: true };
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountPence,
            currency: 'gbp',
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
        const secret = await this.getWebhookSecret();
        const stripe = await this.getStripe();
        if (!secret || !stripe) return { received: true };

        let event: any;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, secret);
        } catch {
            throw new BadRequestException('Invalid webhook signature');
        }

        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            const order = await this.prisma.order.findFirst({
                where: { paymentIntentId: pi.id },
            });

            if (order) {
                if (order.status === 'PENDING') {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'CONFIRMED' },
                    });
                }
            } else {
                // This webhook fires the instant Stripe confirms the charge, which can beat
                // our own order-creation request (client confirms payment, then calls our API,
                // then we re-verify with Stripe before writing the row) — so a missing order
                // here is often just that race, not a real orphaned payment. Recheck once the
                // order-creation request has had time to land instead of alerting immediately.
                // Not awaited: Stripe expects a fast ack, not a 15s-delayed one.
                setTimeout(() => {
                    this.checkOrphanedPayment(pi).catch(() => {});
                }, 15_000);
            }
        }

        if (event.type === 'payment_intent.payment_failed') {
            const pi = event.data.object;
            const order = await this.prisma.order.findFirst({
                where: { paymentIntentId: pi.id },
            });

            if (order && order.status === 'PENDING') {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'FAILED' },
                });
            }
        }

        if (event.type === 'charge.refunded') {
            const charge = event.data.object;
            const paymentIntentId =
                typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
            const order = paymentIntentId
                ? await this.prisma.order.findFirst({ where: { paymentIntentId } })
                : null;

            if (order && !order.refundId) {
                const isPartial = charge.amount_refunded < charge.amount;
                const refund = charge.refunds?.data?.[0];
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: {
                        refundId: refund?.id ?? charge.id,
                        refundAmount: charge.amount_refunded / 100,
                        status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
                    },
                });
            }
        }

        return { received: true };
    }

    private async checkOrphanedPayment(pi: any) {
        const order = await this.prisma.order.findFirst({
            where: { paymentIntentId: pi.id },
        });
        if (order) return;

        const amountPounds = (pi.amount / 100).toFixed(2);
        const customerEmail = pi.receipt_email ?? pi.metadata?.email ?? 'unknown';
        await this.emailService.sendAdminPaymentAlert({
            paymentIntentId: pi.id,
            amountPounds,
            customerEmail,
        });
    }

    async refundOrder(orderId: string, amountPounds?: number) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found`);
        if (!order.paymentIntentId) throw new BadRequestException('Order has no Stripe payment intent');
        if (order.paymentMethod !== 'stripe') throw new BadRequestException('Order was not paid via Stripe');
        if (order.refundId) throw new BadRequestException('Order has already been refunded');
        if (amountPounds !== undefined && amountPounds > order.total) {
            throw new BadRequestException(`Refund amount £${amountPounds} exceeds order total £${order.total}`);
        }

        const stripe = await this.getStripe();
        if (!stripe) throw new BadRequestException('Stripe is not configured');

        const refundParams: any = { payment_intent: order.paymentIntentId };
        if (amountPounds !== undefined) {
            refundParams.amount = Math.round(amountPounds * 100);
        }

        const refund = await stripe.refunds.create(refundParams);

        const isPartial = amountPounds !== undefined && amountPounds < order.total;
        const newStatus = isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED';

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                refundId: refund.id,
                refundAmount: amountPounds ?? order.total,
                status: newStatus,
            },
        });

        return { refundId: refund.id, amount: amountPounds ?? order.total, status: updated.status };
    }

    async getSettings() {
        const [skTest, skLive, wsTest, wsLive, pkTest, pkLive, mode] = await Promise.all([
            this.settingsService.get('STRIPE_SECRET_KEY_TEST'),
            this.settingsService.get('STRIPE_SECRET_KEY_LIVE'),
            this.settingsService.get('STRIPE_WEBHOOK_SECRET_TEST'),
            this.settingsService.get('STRIPE_WEBHOOK_SECRET_LIVE'),
            this.settingsService.get('STRIPE_PUBLISHABLE_KEY_TEST'),
            this.settingsService.get('STRIPE_PUBLISHABLE_KEY_LIVE'),
            this.settingsService.get('STRIPE_MODE'),
        ]);
        return {
            mode: mode ?? 'test',
            stripeSecretKeyTest: this.settingsService.mask(skTest),
            stripeSecretKeyLive: this.settingsService.mask(skLive),
            stripeWebhookSecretTest: this.settingsService.mask(wsTest),
            stripeWebhookSecretLive: this.settingsService.mask(wsLive),
            // Publishable keys aren't secret — they ship to the browser — so return them in full.
            stripePublishableKeyTest: pkTest,
            stripePublishableKeyLive: pkLive,
        };
    }

    async updateSettings(dto: {
        mode?: string;
        stripeSecretKeyTest?: string;
        stripeSecretKeyLive?: string;
        stripeWebhookSecretTest?: string;
        stripeWebhookSecretLive?: string;
        stripePublishableKeyTest?: string;
        stripePublishableKeyLive?: string;
    }) {
        const map: Record<string, string | undefined> = {
            STRIPE_MODE: dto.mode,
            STRIPE_SECRET_KEY_TEST: dto.stripeSecretKeyTest,
            STRIPE_SECRET_KEY_LIVE: dto.stripeSecretKeyLive,
            STRIPE_WEBHOOK_SECRET_TEST: dto.stripeWebhookSecretTest,
            STRIPE_WEBHOOK_SECRET_LIVE: dto.stripeWebhookSecretLive,
            STRIPE_PUBLISHABLE_KEY_TEST: dto.stripePublishableKeyTest,
            STRIPE_PUBLISHABLE_KEY_LIVE: dto.stripePublishableKeyLive,
        };
        await Promise.all(
            Object.entries(map)
                .filter(([, v]) => v !== undefined && v !== '')
                .map(([key, value]) => this.settingsService.set(key, value!)),
        );
        return this.getSettings();
    }

    async testConnection() {
        const stripe = await this.getStripe();
        if (!stripe) throw new BadRequestException('Stripe not configured for active mode');
        try {
            const account = await stripe.accounts.retrieve();
            return { ok: true, accountId: account.id };
        } catch (err: any) {
            throw new BadRequestException(err?.message ?? 'Stripe key invalid');
        }
    }
}

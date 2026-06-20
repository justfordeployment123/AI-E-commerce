# Stripe Payment Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add encrypted admin-managed Stripe keys (test/live toggle), a webhook safety net that auto-confirms orders and emails admin on missing order, and a full/partial refund flow manageable from the admin orders page.

**Architecture:** A new `SettingsService` module encrypts Stripe secrets with AES-256-GCM and stores them in a new `AppSetting` DB table, with an in-memory cache and `process.env` fallback for zero-downtime rollout. `PaymentsService` is refactored to hot-load keys from `SettingsService` at request time (no restart needed on key rotation). A new admin settings page at `/settings` manages the keys and mode toggle. A refund endpoint + refund dialog on the orders page complete the admin → customer money flow.

**Tech Stack:** NestJS (backend), Prisma (ORM), Node.js `crypto` (AES-256-GCM), Next.js App Router (admin frontend), Tailwind CSS, Lucide icons, Stripe SDK (`stripe` npm package already installed).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/prisma/schema.prisma` | Modify | Add `AppSetting` model, `PARTIALLY_REFUNDED` enum value, `refundId`/`refundAmount`/`paymentMethod` on `Order` |
| `apps/api/src/modules/settings/settings.service.ts` | Create | AES-256-GCM encrypt/decrypt, cache, get/set/mask |
| `apps/api/src/modules/settings/settings.module.ts` | Create | NestJS module exporting `SettingsService` |
| `apps/api/src/modules/settings/settings.service.spec.ts` | Create | Unit tests for encryption, cache, env fallback, mask |
| `apps/api/src/modules/payments/payments.module.ts` | Modify | Import `SettingsModule`, `EmailModule` |
| `apps/api/src/modules/payments/payments.service.ts` | Modify | Hot-reload keys via `getStripe()`/`getWebhookSecret()`, add webhook safety net, add `refundOrder()`, add settings getters/setters |
| `apps/api/src/modules/payments/payments.controller.ts` | Modify | Add `GET/PUT /payments/settings`, `POST /payments/settings/test`, `POST /payments/refund` |
| `apps/api/src/modules/payments/dto/payment-settings.dto.ts` | Create | DTO for PUT /payments/settings |
| `apps/api/src/modules/payments/dto/refund-order.dto.ts` | Create | DTO for POST /payments/refund |
| `apps/api/src/app.module.ts` | Modify | Import `SettingsModule` |
| `apps/api/.env.example` | Modify | Add `ENCRYPTION_KEY` |
| `apps/admin/lib/api.ts` | Modify | Extend `Order` interface, add `paymentSettingsApi`, add `paymentsApi.refund` |
| `apps/admin/components/Sidebar.tsx` | Modify | Add Settings nav link after Pricing |
| `apps/admin/app/settings/page.tsx` | Create | Admin settings UI (key management + mode toggle) |
| `apps/admin/app/orders/page.tsx` | Modify | Add refund button + inline dialog to order detail panel |

---

## Task 1: Prisma Schema — AppSetting, PARTIALLY_REFUNDED, Order refund fields

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add PARTIALLY_REFUNDED to OrderStatus enum**

In `apps/api/prisma/schema.prisma`, find the `OrderStatus` enum and add the new value:

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
}
```

- [ ] **Step 2: Add refundId, refundAmount, paymentMethod to Order model**

Find the `Order` model and add three fields after `paymentIntentId`:

```prisma
model Order {
  id              String      @id @default(uuid())
  userId          String?
  user            User?       @relation(fields: [userId], references: [id])
  status          OrderStatus @default(PENDING)
  subtotal        Float
  shipping        Float       @default(0)
  total           Float
  shippingAddress Json
  paymentMethod   String?
  paymentIntentId String?
  refundId        String?
  refundAmount    Float?
  discount        Float   @default(0)
  trackingNumber  String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items OrderItem[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}
```

- [ ] **Step 3: Add AppSetting model**

At the end of the schema file (after the last model), add:

```prisma
model AppSetting {
  key            String   @id
  encryptedValue String
  updatedAt      DateTime @updatedAt

  @@map("app_settings")
}
```

- [ ] **Step 4: Generate and run the migration**

```bash
cd apps/api
npx prisma migrate dev --name add_app_settings_and_refund_fields
```

Expected output:
```
The following migration(s) have been created and applied from new schema changes:
migrations/..._add_app_settings_and_refund_fields
```

- [ ] **Step 5: Verify Prisma client regenerated**

```bash
cd apps/api
npx prisma generate
```

Expected: `Generated Prisma Client` with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(db): add AppSetting model, PARTIALLY_REFUNDED status, refund fields on Order"
```

---

## Task 2: SettingsService — encryption, cache, get/set/mask

**Files:**
- Create: `apps/api/src/modules/settings/settings.service.ts`
- Create: `apps/api/src/modules/settings/settings.module.ts`

- [ ] **Step 1: Create SettingsService**

Create `apps/api/src/modules/settings/settings.service.ts`:

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';

const PLAINTEXT_KEYS = new Set(['STRIPE_MODE']);

@Injectable()
export class SettingsService implements OnModuleInit {
    private readonly logger = new Logger(SettingsService.name);
    private readonly cache = new Map<string, string>();
    private encKey: Buffer;

    constructor(private readonly prisma: PrismaService) {}

    onModuleInit() {
        const hex = process.env.ENCRYPTION_KEY ?? '';
        if (hex.length !== 64) {
            this.logger.warn('ENCRYPTION_KEY is missing or not 64 hex chars — encrypted settings will not work');
            this.encKey = Buffer.alloc(32);
        } else {
            this.encKey = Buffer.from(hex, 'hex');
        }
    }

    private encrypt(plaintext: string): string {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.encKey, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    private decrypt(stored: string): string {
        const [ivHex, authTagHex, ctHex] = stored.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const ct = Buffer.from(ctHex, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', this.encKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    }

    async get(key: string): Promise<string | null> {
        if (this.cache.has(key)) return this.cache.get(key)!;

        const row = await this.prisma.appSetting.findUnique({ where: { key } });
        if (row) {
            const value = PLAINTEXT_KEYS.has(key) ? row.encryptedValue : this.decrypt(row.encryptedValue);
            this.cache.set(key, value);
            return value;
        }

        const envVal = process.env[key] ?? null;
        if (envVal) this.cache.set(key, envVal);
        return envVal;
    }

    async set(key: string, plaintext: string): Promise<void> {
        const stored = PLAINTEXT_KEYS.has(key) ? plaintext : this.encrypt(plaintext);
        await this.prisma.appSetting.upsert({
            where: { key },
            update: { encryptedValue: stored },
            create: { key, encryptedValue: stored },
        });
        this.cache.delete(key);
    }

    mask(value: string | null): string | null {
        if (!value) return null;
        const lastUnderscore = value.lastIndexOf('_');
        const prefix = lastUnderscore >= 0 ? value.slice(0, lastUnderscore + 1) : '';
        return `${prefix}****${value.slice(-4)}`;
    }
}
```

- [ ] **Step 2: Create SettingsModule**

Create `apps/api/src/modules/settings/settings.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [SettingsService],
    exports: [SettingsService],
})
export class SettingsModule {}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/settings/
git commit -m "feat(settings): add SettingsService with AES-256-GCM encryption and memory cache"
```

---

## Task 3: SettingsService unit tests

**Files:**
- Create: `apps/api/src/modules/settings/settings.service.spec.ts`

- [ ] **Step 1: Write tests**

Create `apps/api/src/modules/settings/settings.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SettingsService } from './settings.service';
import { PrismaService } from '../database/prisma.service';

function makePrismaMock() {
    return {
        appSetting: {
            findUnique: jest.fn<() => Promise<any>>().mockResolvedValue(null),
            upsert: jest.fn<() => Promise<any>>().mockResolvedValue({}),
        },
    };
}

describe('SettingsService', () => {
    let service: SettingsService;
    let prismaMock: ReturnType<typeof makePrismaMock>;

    beforeEach(async () => {
        process.env.ENCRYPTION_KEY = 'a'.repeat(64);
        prismaMock = makePrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
        service.onModuleInit();
    });

    describe('encrypt / decrypt round-trip', () => {
        it('decrypts to original plaintext after set+get', async () => {
            const plain = 'sk_test_abc123def456';
            await service.set('STRIPE_SECRET_KEY_TEST', plain);

            const upsertCall = (prismaMock.appSetting.upsert as any).mock.calls[0][0];
            const stored = upsertCall.create.encryptedValue;

            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce({
                key: 'STRIPE_SECRET_KEY_TEST',
                encryptedValue: stored,
            });
            service['cache'].clear();

            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBe(plain);
        });

        it('produces different ciphertext for same plaintext (random IV)', async () => {
            await service.set('STRIPE_SECRET_KEY_TEST', 'same-value');
            await service.set('STRIPE_SECRET_KEY_TEST', 'same-value');

            const calls = (prismaMock.appSetting.upsert as any).mock.calls;
            const stored1 = calls[0][0].create.encryptedValue;
            const stored2 = calls[1][0].create.encryptedValue;
            expect(stored1).not.toBe(stored2);
        });
    });

    describe('get()', () => {
        it('returns cached value without hitting DB', async () => {
            service['cache'].set('STRIPE_SECRET_KEY_TEST', 'cached_value');
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBe('cached_value');
            expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
        });

        it('falls back to process.env when DB has no row', async () => {
            process.env['STRIPE_SECRET_KEY_TEST'] = 'env_fallback_value';
            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce(null);
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBe('env_fallback_value');
            delete process.env['STRIPE_SECRET_KEY_TEST'];
        });

        it('returns null when DB has no row and env is unset', async () => {
            delete process.env['STRIPE_SECRET_KEY_TEST'];
            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce(null);
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBeNull();
        });
    });

    describe('set()', () => {
        it('stores STRIPE_MODE without encryption (plaintext)', async () => {
            await service.set('STRIPE_MODE', 'live');
            const call = (prismaMock.appSetting.upsert as any).mock.calls[0][0];
            expect(call.update.encryptedValue).toBe('live');
            expect(call.create.encryptedValue).toBe('live');
        });

        it('clears cache entry after set so next get re-fetches', async () => {
            service['cache'].set('STRIPE_SECRET_KEY_TEST', 'old_value');
            await service.set('STRIPE_SECRET_KEY_TEST', 'new_value');
            expect(service['cache'].has('STRIPE_SECRET_KEY_TEST')).toBe(false);
        });
    });

    describe('mask()', () => {
        it('shows key type prefix and last 4 chars', () => {
            expect(service.mask('sk_live_abcdefghij1234')).toBe('sk_live_****1234');
            expect(service.mask('sk_test_abcdefghij5678')).toBe('sk_test_****5678');
            expect(service.mask('whsec_abcdefghij9012')).toBe('whsec_****9012');
        });

        it('returns null for null input', () => {
            expect(service.mask(null)).toBeNull();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd apps/api
npx jest src/modules/settings/settings.service.spec.ts --no-coverage
```

Expected: All 8 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/settings/settings.service.spec.ts
git commit -m "test(settings): unit tests for SettingsService encryption, cache, mask"
```

---

## Task 4: Wire SettingsModule and EmailModule into PaymentsModule

**Files:**
- Modify: `apps/api/src/modules/payments/payments.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Update PaymentsModule**

Replace the full content of `apps/api/src/modules/payments/payments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailModule } from '../../common/services/email.module';

@Module({
    imports: [DatabaseModule, SettingsModule, EmailModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
})
export class PaymentsModule {}
```

- [ ] **Step 2: Import SettingsModule in AppModule**

In `apps/api/src/app.module.ts`, add the import at the top:

```typescript
import { SettingsModule } from './modules/settings/settings.module';
```

And add `SettingsModule` to the `imports` array (after `DatabaseModule`):

```typescript
imports: [
    ConfigModule,
    DatabaseModule,
    SettingsModule,   // ← add this line
    CacheModule,
    // ... rest unchanged
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payments/payments.module.ts apps/api/src/app.module.ts
git commit -m "feat(payments): wire SettingsModule and EmailModule into PaymentsModule"
```

---

## Task 5: PaymentsService — hot-reload keys via getStripe() / getWebhookSecret()

**Files:**
- Modify: `apps/api/src/modules/payments/payments.service.ts`

- [ ] **Step 1: Rewrite PaymentsService with hot-reload key loading**

Replace the full content of `apps/api/src/modules/payments/payments.service.ts`:

```typescript
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../../common/services/email.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const StripeLib = require('stripe');

const VALID_PROMO_CODES: Record<string, number> = {
    TECHSTOP10: 0.10,
};

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

        const discountRate = promoCode ? (VALID_PROMO_CODES[promoCode.toUpperCase()] ?? 0) : 0;
        const discount = Math.round(subtotal * discountRate * 100) / 100;
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
                const amountPounds = (pi.amount / 100).toFixed(2);
                const customerEmail = pi.receipt_email ?? pi.metadata?.email ?? 'unknown';
                await this.emailService.sendAdminPaymentAlert({
                    paymentIntentId: pi.id,
                    amountPounds,
                    customerEmail,
                });
            }
        }

        return { received: true };
    }

    async refundOrder(orderId: string, amountPounds?: number) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found`);
        if (!order.paymentIntentId) throw new BadRequestException('Order has no Stripe payment intent');
        if (order.paymentMethod !== 'stripe') throw new BadRequestException('Order was not paid via Stripe');
        if (order.refundId) throw new BadRequestException('Order has already been refunded');

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
        const [skTest, skLive, wsTest, wsLive, mode] = await Promise.all([
            this.settingsService.get('STRIPE_SECRET_KEY_TEST'),
            this.settingsService.get('STRIPE_SECRET_KEY_LIVE'),
            this.settingsService.get('STRIPE_WEBHOOK_SECRET_TEST'),
            this.settingsService.get('STRIPE_WEBHOOK_SECRET_LIVE'),
            this.settingsService.get('STRIPE_MODE'),
        ]);
        return {
            mode: mode ?? 'test',
            stripeSecretKeyTest: this.settingsService.mask(skTest),
            stripeSecretKeyLive: this.settingsService.mask(skLive),
            stripeWebhookSecretTest: this.settingsService.mask(wsTest),
            stripeWebhookSecretLive: this.settingsService.mask(wsLive),
        };
    }

    async updateSettings(dto: {
        mode?: string;
        stripeSecretKeyTest?: string;
        stripeSecretKeyLive?: string;
        stripeWebhookSecretTest?: string;
        stripeWebhookSecretLive?: string;
    }) {
        const map: Record<string, string | undefined> = {
            STRIPE_MODE: dto.mode,
            STRIPE_SECRET_KEY_TEST: dto.stripeSecretKeyTest,
            STRIPE_SECRET_KEY_LIVE: dto.stripeSecretKeyLive,
            STRIPE_WEBHOOK_SECRET_TEST: dto.stripeWebhookSecretTest,
            STRIPE_WEBHOOK_SECRET_LIVE: dto.stripeWebhookSecretLive,
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
```

- [ ] **Step 2: Add sendAdminPaymentAlert to EmailService**

In `apps/api/src/common/services/email.service.ts`, add this method at the end of the class body (before the closing `}`):

```typescript
    async sendAdminPaymentAlert(opts: {
        paymentIntentId: string;
        amountPounds: string;
        customerEmail: string;
    }) {
        const adminEmail = process.env.SMTP_USER;
        if (!adminEmail) return;
        try {
            await this.transporter.sendMail({
                from: `"TechStop Leicester" <${adminEmail}>`,
                to: adminEmail,
                subject: `[URGENT] Payment received but no order found — £${opts.amountPounds}`,
                text: [
                    'A Stripe payment succeeded but no matching order was found in the database.',
                    '',
                    `Payment Intent ID: ${opts.paymentIntentId}`,
                    `Amount: £${opts.amountPounds}`,
                    `Customer email: ${opts.customerEmail}`,
                    '',
                    'Action required: check the Stripe dashboard and manually create or investigate this order.',
                ].join('\n'),
            });
        } catch (err) {
            this.logger.error('Failed to send admin payment alert', err);
        }
    }
```

- [ ] **Step 3: Verify the API compiles**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: No errors. If any type errors appear, check that `PrismaService` generates `appSetting` (Task 1 migration must be complete).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/payments/payments.service.ts apps/api/src/common/services/email.service.ts
git commit -m "feat(payments): hot-reload Stripe keys, webhook safety net, refundOrder, settings getters"
```

---

## Task 6: PaymentsService unit tests — refundOrder guard conditions

**Files:**
- Create: `apps/api/src/modules/payments/payments.service.spec.ts`

- [ ] **Step 1: Write tests for refundOrder guard conditions**

Create `apps/api/src/modules/payments/payments.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../../common/services/email.service';

function makeOrder(overrides: Partial<any> = {}) {
    return {
        id: 'order-1',
        paymentIntentId: 'pi_test_123',
        paymentMethod: 'stripe',
        refundId: null,
        total: 99.99,
        status: 'CONFIRMED',
        ...overrides,
    };
}

describe('PaymentsService.refundOrder', () => {
    let service: PaymentsService;
    let prismaMock: any;
    let settingsMock: any;

    beforeEach(async () => {
        prismaMock = {
            order: {
                findUnique: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>().mockResolvedValue(makeOrder({ status: 'REFUNDED', refundId: 're_123' })),
            },
            product: { findMany: jest.fn() },
        };
        settingsMock = {
            get: jest.fn<() => Promise<string | null>>().mockResolvedValue('test'),
            set: jest.fn(),
            mask: jest.fn((v: string | null) => v),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: SettingsService, useValue: settingsMock },
                { provide: EmailService, useValue: { sendAdminPaymentAlert: jest.fn() } },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('throws NotFoundException when order does not exist', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(null);
        await expect(service.refundOrder('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order has no paymentIntentId', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ paymentIntentId: null }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when paymentMethod is not stripe', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ paymentMethod: 'dev' }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when order already has a refundId', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ refundId: 're_already' }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when Stripe key is not configured', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder());
        settingsMock.get.mockResolvedValue(null);
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });
});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/api
npx jest src/modules/payments/payments.service.spec.ts --no-coverage
```

Expected: All 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payments/payments.service.spec.ts
git commit -m "test(payments): unit tests for refundOrder guard conditions"
```

---

## Task 7: DTOs — PaymentSettingsDto and RefundOrderDto

**Files:**
- Create: `apps/api/src/modules/payments/dto/payment-settings.dto.ts`
- Create: `apps/api/src/modules/payments/dto/refund-order.dto.ts`

- [ ] **Step 1: Create PaymentSettingsDto**

Create `apps/api/src/modules/payments/dto/payment-settings.dto.ts`:

```typescript
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class PaymentSettingsDto {
    @IsOptional()
    @IsIn(['test', 'live'])
    mode?: string;

    @IsOptional()
    @IsString()
    @Matches(/^sk_test_/, { message: 'Must be a Stripe test secret key (sk_test_...)' })
    stripeSecretKeyTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^sk_live_/, { message: 'Must be a Stripe live secret key (sk_live_...)' })
    stripeSecretKeyLive?: string;

    @IsOptional()
    @IsString()
    @Matches(/^whsec_/, { message: 'Must be a Stripe webhook secret (whsec_...)' })
    stripeWebhookSecretTest?: string;

    @IsOptional()
    @IsString()
    @Matches(/^whsec_/, { message: 'Must be a Stripe webhook secret (whsec_...)' })
    stripeWebhookSecretLive?: string;
}
```

- [ ] **Step 2: Create RefundOrderDto**

Create `apps/api/src/modules/payments/dto/refund-order.dto.ts`:

```typescript
import { IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class RefundOrderDto {
    @IsUUID()
    @IsString()
    orderId: string;

    @IsOptional()
    @IsPositive()
    amountPounds?: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payments/dto/
git commit -m "feat(payments): add PaymentSettingsDto and RefundOrderDto"
```

---

## Task 8: PaymentsController — add settings and refund endpoints

**Files:**
- Modify: `apps/api/src/modules/payments/payments.controller.ts`

- [ ] **Step 1: Replace PaymentsController**

Replace the full content of `apps/api/src/modules/payments/payments.controller.ts`:

```typescript
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
```

- [ ] **Step 2: Verify compile**

```bash
cd apps/api
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/payments/payments.controller.ts
git commit -m "feat(payments): add settings GET/PUT, test connection, and refund endpoints"
```

---

## Task 9: Update .env.example

**Files:**
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Add ENCRYPTION_KEY**

In `apps/api/.env.example`, replace the Stripe section at the bottom:

```env
# ─── Stripe (payments) ────────────────────────────────────────────────────────
# Use sk_test_* in development, sk_live_* in production
STRIPE_SECRET_KEY=sk_test_your_secret_key
# Webhook secret: Stripe Dashboard → Webhooks → your endpoint → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ─── Encryption (for admin-managed secrets stored in DB) ──────────────────────
# Generate with: openssl rand -hex 32
# NEVER change this after first deploy — it will make all stored settings unreadable
ENCRYPTION_KEY=your_64_hex_char_encryption_key_here
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/.env.example
git commit -m "docs: add ENCRYPTION_KEY to .env.example"
```

---

## Task 10: Admin API client — extend Order type and add payment APIs

**Files:**
- Modify: `apps/admin/lib/api.ts`

- [ ] **Step 1: Extend Order interface**

In `apps/admin/lib/api.ts`, find the `Order` interface (line ~533) and add the new fields:

```typescript
export interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  shippingAddress: Record<string, string>;
  paymentMethod?: string;
  paymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  trackingNumber?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { id: string; name: string; slug: string; condition: string };
  }[];
}
```

- [ ] **Step 2: Add paymentSettingsApi and refund method**

Find the `ordersApi` export in `apps/admin/lib/api.ts` and add these two new exports **after** it (before the `Order` interface):

```typescript
export interface PaymentSettings {
  mode: 'test' | 'live';
  stripeSecretKeyTest: string | null;
  stripeSecretKeyLive: string | null;
  stripeWebhookSecretTest: string | null;
  stripeWebhookSecretLive: string | null;
}

export const paymentSettingsApi = {
  get: () => apiFetch<PaymentSettings>('/payments/settings'),
  update: (data: Partial<PaymentSettings & { stripeSecretKeyTest: string; stripeSecretKeyLive: string; stripeWebhookSecretTest: string; stripeWebhookSecretLive: string }>) =>
    apiFetch<PaymentSettings>('/payments/settings', { method: 'PUT', body: JSON.stringify(data) }),
  test: () => apiFetch<{ ok: boolean; accountId: string }>('/payments/settings/test', { method: 'POST' }),
  refund: (orderId: string, amountPounds?: number) =>
    apiFetch<{ refundId: string; amount: number; status: string }>('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ orderId, ...(amountPounds !== undefined ? { amountPounds } : {}) }),
    }),
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/lib/api.ts
git commit -m "feat(admin-api): add PaymentSettings types, paymentSettingsApi, and refund method"
```

---

## Task 11: Admin Settings Page

**Files:**
- Create: `apps/admin/app/settings/page.tsx`

- [ ] **Step 1: Create the settings page**

Create `apps/admin/app/settings/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Save, Check, Zap, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { paymentSettingsApi, type PaymentSettings } from "../../lib/api";

type TestResult = { ok: true; accountId: string } | { ok: false; error: string } | null;

interface FieldState {
  masked: string | null;
  editing: boolean;
  draft: string;
}

function makeField(masked: string | null): FieldState {
  return { masked, editing: false, draft: "" };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [mode, setMode] = useState<"test" | "live">("test");
  const [showLiveBanner, setShowLiveBanner] = useState(false);

  const [fields, setFields] = useState({
    stripeSecretKeyTest: makeField(null),
    stripeSecretKeyLive: makeField(null),
    stripeWebhookSecretTest: makeField(null),
    stripeWebhookSecretLive: makeField(null),
  });

  useEffect(() => {
    paymentSettingsApi.get()
      .then((s: PaymentSettings) => {
        setMode(s.mode ?? "test");
        setFields({
          stripeSecretKeyTest: makeField(s.stripeSecretKeyTest),
          stripeSecretKeyLive: makeField(s.stripeSecretKeyLive),
          stripeWebhookSecretTest: makeField(s.stripeWebhookSecretTest),
          stripeWebhookSecretLive: makeField(s.stripeWebhookSecretLive),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function startEdit(key: keyof typeof fields) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: true, draft: "" } }));
  }

  function cancelEdit(key: keyof typeof fields) {
    setFields(f => ({ ...f, [key]: { ...f[key], editing: false, draft: "" } }));
  }

  function setDraft(key: keyof typeof fields, value: string) {
    setFields(f => ({ ...f, [key]: { ...f[key], draft: value } }));
  }

  function handleModeToggle(newMode: "test" | "live") {
    if (newMode === "live" && mode !== "live") {
      setShowLiveBanner(true);
    }
    setMode(newMode);
  }

  async function handleSave() {
    setSaving(true);
    setTestResult(null);
    try {
      const payload: Record<string, string> = { mode };
      for (const [key, field] of Object.entries(fields)) {
        if (field.editing && field.draft.trim()) {
          payload[key] = field.draft.trim();
        }
      }
      const updated = await paymentSettingsApi.update(payload as any);
      setMode(updated.mode);
      setFields({
        stripeSecretKeyTest: makeField(updated.stripeSecretKeyTest),
        stripeSecretKeyLive: makeField(updated.stripeSecretKeyLive),
        stripeWebhookSecretTest: makeField(updated.stripeWebhookSecretTest),
        stripeWebhookSecretLive: makeField(updated.stripeWebhookSecretLive),
      });
      setShowLiveBanner(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await paymentSettingsApi.test();
      setTestResult({ ok: true, accountId: result.accountId });
    } catch (err: any) {
      setTestResult({ ok: false, error: err?.message ?? "Connection failed" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage Stripe API keys and payment mode.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold hover:border-zinc-400 transition-colors disabled:opacity-60"
          >
            {testing
              ? <div className="h-3.5 w-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              : <Zap className="h-3.5 w-3.5" />}
            Test Connection
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"}`}
          >
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium ${testResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {testResult.ok
            ? <><CheckCircle className="h-4 w-4 shrink-0" /> Connected — Account: {testResult.accountId}</>
            : <><XCircle className="h-4 w-4 shrink-0" /> {testResult.error}</>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 max-w-2xl">
        <p className="text-sm font-bold mb-5">Stripe Payment Keys</p>

        {/* Mode toggle */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Active Mode</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleModeToggle("test")}
              className={`h-9 px-5 rounded-xl text-sm font-bold transition-all ${mode === "test" ? "bg-black text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
            >
              Test Mode
            </button>
            <button
              onClick={() => handleModeToggle("live")}
              className={`h-9 px-5 rounded-xl text-sm font-bold transition-all ${mode === "live" ? "bg-black text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
            >
              Live Mode
            </button>
          </div>
          {showLiveBanner && mode === "live" && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Live mode is active — real customer cards will be charged. Save to confirm.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <KeySection
            title="Test Keys"
            fields={[
              { label: "Secret Key", fieldKey: "stripeSecretKeyTest", placeholder: "sk_test_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretTest", placeholder: "whsec_..." },
            ]}
            state={fields}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
          />
          <KeySection
            title="Live Keys"
            fields={[
              { label: "Secret Key", fieldKey: "stripeSecretKeyLive", placeholder: "sk_live_..." },
              { label: "Webhook Secret", fieldKey: "stripeWebhookSecretLive", placeholder: "whsec_..." },
            ]}
            state={fields}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onDraftChange={setDraft}
          />
        </div>
      </div>
    </div>
  );
}

type FieldKey = "stripeSecretKeyTest" | "stripeSecretKeyLive" | "stripeWebhookSecretTest" | "stripeWebhookSecretLive";

function KeySection({
  title,
  fields,
  state,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
}: {
  title: string;
  fields: { label: string; fieldKey: FieldKey; placeholder: string }[];
  state: Record<FieldKey, FieldState>;
  onStartEdit: (key: FieldKey) => void;
  onCancelEdit: (key: FieldKey) => void;
  onDraftChange: (key: FieldKey, value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{title}</p>
      <div className="space-y-3">
        {fields.map(({ label, fieldKey, placeholder }) => {
          const field = state[fieldKey];
          return (
            <div key={fieldKey}>
              <label className="text-xs font-semibold text-zinc-500 block mb-1.5">{label}</label>
              {field.editing ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={field.draft}
                    onChange={e => onDraftChange(fieldKey, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 h-10 px-3 rounded-xl border-2 border-black font-mono text-sm outline-none"
                  />
                  <button
                    onClick={() => onCancelEdit(fieldKey)}
                    className="h-10 px-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center font-mono text-sm text-zinc-500">
                    {field.masked ?? <span className="text-zinc-300 italic text-xs">Not configured</span>}
                  </div>
                  <button
                    onClick={() => onStartEdit(fieldKey)}
                    className="h-10 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/app/settings/
git commit -m "feat(admin): add payment settings page with test/live key management and mode toggle"
```

---

## Task 12: Admin Sidebar — add Settings nav link

**Files:**
- Modify: `apps/admin/components/Sidebar.tsx`

- [ ] **Step 1: Add Settings to NAV array**

In `apps/admin/components/Sidebar.tsx`, find the `NAV` array and add the Settings entry after the Pricing Rules entry. Also add the `Settings` icon import.

At the top of the file, change the import to include `Settings`:

```typescript
import {
  LayoutDashboard, Package, RefreshCw, Wrench, ShoppingBag,
  SlidersHorizontal, BarChart3, LogOut, ChevronRight, ListPlus, MapPin, TrendingUp, HeadphonesIcon, Star, Phone, DatabaseZap, Layers, Image, Boxes, Settings
} from "lucide-react";
```

In the `NAV` array, add after the Pricing Rules entry:

```typescript
  { href: "/pricing", label: "Pricing Rules", icon: SlidersHorizontal, section: "Settings" },
  { href: "/settings", label: "Payment Settings", icon: Settings },
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/components/Sidebar.tsx
git commit -m "feat(admin): add Payment Settings link to sidebar nav"
```

---

## Task 13: Admin Orders Page — refund button and dialog

**Files:**
- Modify: `apps/admin/app/orders/page.tsx`

- [ ] **Step 1: Add imports and state**

At the top of `apps/admin/app/orders/page.tsx`, add `CreditCard` to the lucide-react import:

```typescript
import { Search, ShoppingBag, Eye, X, Truck, Check, Clock, MapPin, Package, Mail, Phone, Trash2, CreditCard } from "lucide-react";
```

Add `paymentSettingsApi` to the api import:

```typescript
import { ordersApi, paymentSettingsApi, type Order } from "../../lib/api";
```

Add these state variables inside the `OrdersPage` component function, after the existing state declarations:

```typescript
  const [refunding, setRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundError, setRefundError] = useState("");
```

- [ ] **Step 2: Add STATUS_CFG entries for new statuses**

In `apps/admin/app/orders/page.tsx`, extend the `STATUS_CFG` object to include the two new statuses:

```typescript
const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:            { label: "Processing",        cls: "bg-blue-100 text-blue-700",    icon: Clock },
  CONFIRMED:          { label: "Confirmed",          cls: "bg-violet-100 text-violet-700", icon: Check },
  SHIPPED:            { label: "Dispatched",         cls: "bg-violet-100 text-violet-700", icon: Truck },
  DELIVERED:          { label: "Delivered",          cls: "bg-emerald-100 text-emerald-700", icon: Check },
  CANCELLED:          { label: "Cancelled",          cls: "bg-red-100 text-red-500",       icon: X },
  REFUNDED:           { label: "Refunded",           cls: "bg-orange-100 text-orange-600", icon: CreditCard },
  PARTIALLY_REFUNDED: { label: "Part. Refunded",     cls: "bg-orange-100 text-orange-600", icon: CreditCard },
};
```

- [ ] **Step 3: Add handleRefund function**

Add this function inside the `OrdersPage` component, after `handleCancel`:

```typescript
  async function handleRefund(orderId: string) {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setRefundError("Enter a valid amount greater than 0.");
      return;
    }
    const maxAmount = selected?.total ?? 0;
    if (amount > maxAmount) {
      setRefundError(`Amount cannot exceed order total of £${maxAmount.toFixed(2)}.`);
      return;
    }
    setRefunding(true);
    setRefundError("");
    try {
      await paymentSettingsApi.refund(orderId, amount);
      await load();
      const refreshed = (await ordersApi.list({ limit: 100 })).items.find(o => o.id === orderId) ?? null;
      setSelected(refreshed);
      setShowRefundDialog(false);
      setRefundAmount("");
    } catch (err: any) {
      setRefundError(err?.message ?? "Refund failed. Check Stripe dashboard.");
    } finally {
      setRefunding(false);
    }
  }
```

- [ ] **Step 4: Add refund button and dialog to order detail panel**

In the order detail panel, find the `<div className="space-y-2">` block (around line 306) that contains the "Mark as delivered" and "Cancel order" buttons. Add the refund button and dialog **after** the cancel button:

```tsx
              <div className="space-y-2">
                {selected.status === "SHIPPED" && (
                  <button
                    onClick={() => handleDeliver(selected.id)}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark as delivered
                  </button>
                )}
                {(selected.status === "PENDING" || selected.status === "CONFIRMED") && (
                  <button
                    onClick={() => handleCancel(selected.id)}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancel order
                  </button>
                )}

                {/* Refund button — only for Stripe-paid confirmed/shipped/delivered orders not already refunded */}
                {["CONFIRMED", "SHIPPED", "DELIVERED"].includes(selected.status) &&
                  selected.paymentMethod === "stripe" &&
                  selected.paymentIntentId &&
                  !selected.refundId && (
                  <div>
                    {!showRefundDialog ? (
                      <button
                        onClick={() => {
                          setRefundAmount(String(selected.total));
                          setRefundError("");
                          setShowRefundDialog(true);
                        }}
                        className="w-full h-11 rounded-2xl border border-orange-200 text-orange-600 font-bold text-sm hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" /> Issue Refund
                      </button>
                    ) : (
                      <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 space-y-3">
                        <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Issue Refund</p>
                        <p className="text-xs text-orange-600">Order total: £{selected.total.toFixed(2)}</p>
                        <div>
                          <label className="text-xs font-semibold text-zinc-600 block mb-1">Amount to refund (£)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={selected.total}
                            value={refundAmount}
                            onChange={e => setRefundAmount(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border-2 border-orange-200 focus:border-orange-400 font-mono text-sm outline-none bg-white"
                          />
                        </div>
                        {refundError && (
                          <p className="text-xs text-red-600 font-medium">{refundError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowRefundDialog(false); setRefundError(""); }}
                            className="flex-1 h-9 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRefund(selected.id)}
                            disabled={refunding}
                            className="flex-1 h-9 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-60"
                          >
                            {refunding ? "Processing…" : "Confirm Refund"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
```

- [ ] **Step 5: Reset dialog state when selected order changes**

Add a `useEffect` after the existing `useEffect` blocks that resets the dialog when a different order is selected:

```typescript
  useEffect(() => {
    setShowRefundDialog(false);
    setRefundAmount("");
    setRefundError("");
  }, [selected?.id]);
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/orders/page.tsx
git commit -m "feat(admin/orders): add full/partial refund button and dialog to order detail panel"
```

---

## Self-Review Checklist

- [x] **Spec section 3 (data layer):** Task 1 creates all three schema items.
- [x] **Spec section 4 (SettingsService):** Tasks 2–3 cover encrypt/decrypt, cache, get, set, mask, env fallback.
- [x] **Spec section 5 (PaymentsService):** Task 5 covers getStripe(), getWebhookSecret(), createIntent refactor, webhook safety net, refundOrder(), getSettings(), updateSettings().
- [x] **Spec section 6 (API endpoints):** Task 8 covers all four endpoints.
- [x] **Spec section 7.1 (settings page):** Task 11 creates the page with mode toggle, test/live key sections, Test Connection, Save.
- [x] **Spec section 7.2 (sidebar):** Task 12 adds Settings link.
- [x] **Spec section 7.3 (refund button):** Task 13 adds refund button + dialog with correct visibility conditions.
- [x] **Type consistency:** `FieldKey` type in the settings page matches the `fields` state shape. `PaymentSettings` interface matches `getSettings()` return shape. `RefundOrderDto` fields (`orderId`, `amountPounds`) match `refundOrder()` signature.
- [x] **Legacy fallback:** `getStripe()` and `getWebhookSecret()` fall back to `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` env vars (no-suffix) for backward compatibility with existing deployments.
- [x] **sendAdminPaymentAlert:** Added to EmailService in Task 5 Step 2 before being called in the webhook handler.
- [x] **EmailModule in PaymentsModule:** Task 4 wires it.
- [x] **No placeholder steps:** All code blocks are complete.

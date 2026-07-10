import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { PaymentsService } from '../payments/payments.service';
import { ShippingService } from '../shipping/shipping.service';
import { EmailService } from '../../common/services/email.service';

export interface IntegrationStatus {
    /** Whether credentials/env vars are present at all. */
    configured: boolean;
    /** For providers with separate test/live keys — omitted when not applicable. */
    mode?: 'test' | 'live' | 'unknown';
    error?: string;
}

export interface StripeIntegrationStatus extends IntegrationStatus {
    /** Secret key is set for the active mode — same as `configured`, kept separate for clarity alongside the other two. */
    secretKeyConfigured?: boolean;
    webhookConfigured?: boolean;
    publishableKeyConfigured?: boolean;
}

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        private readonly paymentsService: PaymentsService,
        private readonly shippingService: ShippingService,
        private readonly emailService: EmailService,
    ) { }

    async getStatus(): Promise<{
        status: 'ok' | 'degraded';
        postgres: boolean;
        redis: boolean;
        garage: boolean;
        openAi: boolean;
        openAiQuotaOk: boolean;
        scraper: boolean;
        postgresError?: string;
        redisError?: string;
        garageError?: string;
        openAiError?: string;
        scraperUrl: string;
        scraperError?: string;
        databaseUrlConfigured: boolean;
        redisUrlConfigured: boolean;
        garageConfigured: boolean;
        openAiKeyConfigured: boolean;
        database?: { tableCount: number; tables: string[] };
        /** Business integrations — informational only, never flip `status` to degraded
         *  since it's normal for e.g. Stripe/Shippo to be unconfigured in dev. */
        integrations: {
            stripe: StripeIntegrationStatus;
            shippo: IntegrationStatus;
            email: IntegrationStatus;
            googleOAuth: IntegrationStatus;
            socket: IntegrationStatus;
        };
        timestamp: string;
    }> {
        const [postgresCheck, redisCheck, garageCheck, openAiCheck, scraperCheck, stripeCheck, shippoCheck, emailCheck] = await Promise.all([
            this.checkPostgres(),
            this.checkRedis(),
            this.checkGarage(),
            this.checkOpenAi(),
            this.checkScraper(),
            this.checkStripe(),
            this.checkShippo(),
            this.checkEmail(),
        ]);

        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        const status = postgresCheck.ok && redisCheck.ok && garageCheck.ok ? 'ok' : 'degraded';

        return {
            status,
            postgres: postgresCheck.ok,
            redis: redisCheck.ok,
            garage: garageCheck.ok,
            openAi: openAiCheck.ok,
            openAiQuotaOk: openAiCheck.quotaOk,
            scraper: scraperCheck.ok,
            postgresError: postgresCheck.error,
            redisError: redisCheck.error,
            garageError: garageCheck.error,
            openAiError: openAiCheck.error,
            scraperUrl,
            scraperError: scraperCheck.error,
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            redisUrlConfigured: Boolean(process.env.REDIS_URL),
            garageConfigured: Boolean(process.env.GARAGE_ENDPOINT),
            openAiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
            database: postgresCheck.ok ? postgresCheck.database : undefined,
            integrations: {
                stripe: stripeCheck,
                shippo: shippoCheck,
                email: emailCheck,
                googleOAuth: this.checkGoogleOAuth(),
                socket: { configured: true },
            },
            timestamp: new Date().toISOString(),
        };
    }

    private async checkPostgres(): Promise<{ ok: boolean; error?: string; database?: { tableCount: number; tables: string[] } }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            const rows = await this.prisma.$queryRaw<{ tablename: string }[]>`
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            `;
            const tables = rows.map(r => r.tablename);
            return { ok: true, database: { tableCount: tables.length, tables } };
        } catch (error) {
            return {
                ok: false,
                error: this.sanitizeError(error),
            };
        }
    }

    private async checkRedis(): Promise<{ ok: boolean; error?: string }> {
        try {
            await this.redisService.ping();
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: this.sanitizeError(error),
            };
        }
    }

    private async checkGarage(): Promise<{ ok: boolean; error?: string }> {
        try {
            const s3Client = new S3Client({
                region: 'us-east-1',
                endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
                credentials: {
                    accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
                    secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
                },
                forcePathStyle: true,
            });

            const bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';
            const command = new HeadBucketCommand({ Bucket: bucketName });
            await s3Client.send(command);
            return { ok: true };
        } catch (error) {
            const msg = this.sanitizeError(error);
            this.logger.warn(`Garage health check failed: ${msg}`);
            return { ok: false, error: msg };
        }
    }

    private async checkOpenAi(): Promise<{ ok: boolean; quotaOk: boolean; error?: string }> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { ok: false, quotaOk: false, error: 'OPENAI_API_KEY not configured' };
        }
        try {
            const openai = new OpenAI({ apiKey });
            // 1-token completion is the only call that exercises the quota path
            await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: '.' }],
                max_tokens: 1,
            });
            return { ok: true, quotaOk: true };
        } catch (error: any) {
            const code: string = error?.code ?? error?.error?.code ?? '';
            const isQuotaExhausted =
                code === 'insufficient_quota' ||
                code === 'billing_hard_limit_reached' ||
                (error?.status === 429 && code !== 'rate_limit_exceeded');

            if (isQuotaExhausted) {
                return { ok: false, quotaOk: false, error: 'API quota / billing limit exceeded' };
            }
            // Key valid but other error (e.g. transient rate-limit) — key itself is ok
            const keyValid = error?.status !== 401 && error?.status !== 403;
            return { ok: false, quotaOk: keyValid, error: this.sanitizeError(error) };
        }
    }

    private async checkScraper(): Promise<{ ok: boolean; error?: string }> {
        const url = process.env.SCRAPER_URL || 'http://localhost:3003';
        try {
            const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
            return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
        } catch (error) {
            return { ok: false, error: this.sanitizeError(error) };
        }
    }

    private async checkStripe(): Promise<StripeIntegrationStatus> {
        try {
            const { configured, keyMode, webhookConfigured, publishableKeyConfigured } = await this.paymentsService.getHealthStatus();
            return {
                configured,
                mode: configured ? keyMode : undefined,
                secretKeyConfigured: configured,
                webhookConfigured,
                publishableKeyConfigured,
            };
        } catch (error) {
            return { configured: false, error: this.sanitizeError(error) };
        }
    }

    private async checkShippo(): Promise<IntegrationStatus> {
        try {
            const { configured, keyMode } = await this.shippingService.getHealthStatus();
            return { configured, mode: configured ? keyMode : undefined };
        } catch (error) {
            return { configured: false, error: this.sanitizeError(error) };
        }
    }

    private async checkEmail(): Promise<IntegrationStatus> {
        if (!this.emailService.isConfigured()) {
            return { configured: false };
        }
        const result = await this.emailService.verifyConnection();
        return { configured: true, error: result.ok ? undefined : result.error };
    }

    private checkGoogleOAuth(): IntegrationStatus {
        return { configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) };
    }

    private sanitizeError(error: unknown): string {
        if (error instanceof AggregateError && error.errors?.length) {
            const inner = error.errors.map((e: NodeJS.ErrnoException) => e.message || e.code || String(e)).join('; ');
            return `${error.message ? error.message + ': ' : ''}${inner}`;
        }
        if (error instanceof Error) {
            const base = (error as NodeJS.ErrnoException);
            const parts = [base.message, base.code].filter(Boolean);
            const msg = parts.join(' ') || error.name || 'Unknown error';
            return msg.replace(/(postgres(?:ql)?:\/\/)[^\s@]+@/gi, '$1***:***@');
        }
        if (typeof error === 'string') return error;
        try { return JSON.stringify(error); } catch { return 'Unknown error'; }
    }
}

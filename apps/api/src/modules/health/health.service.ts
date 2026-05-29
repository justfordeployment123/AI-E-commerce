import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) { }

    async getStatus(): Promise<{
        status: 'ok' | 'degraded';
        postgres: boolean;
        redis: boolean;
        garage: boolean;
        openAi: boolean;
        scraper: boolean;
        storageProxy: boolean;
        postgresError?: string;
        redisError?: string;
        garageError?: string;
        openAiError?: string;
        scraperUrl: string;
        scraperError?: string;
        storageProxyUrl: string | null;
        storageProxyError?: string;
        databaseUrlConfigured: boolean;
        redisUrlConfigured: boolean;
        garageConfigured: boolean;
        openAiKeyConfigured: boolean;
        database?: { tableCount: number; tables: string[] };
        timestamp: string;
    }> {
        const [postgresCheck, redisCheck, garageCheck, openAiCheck, scraperCheck] = await Promise.all([
            this.checkPostgres(),
            this.checkRedis(),
            this.checkGarage(),
            this.checkOpenAi(),
            this.checkScraper(),
        ]);

        const proxyUrl = process.env.GARAGE_PROXY_URL || null;
        const scraperUrl = process.env.SCRAPER_URL || 'http://localhost:3003';
        const storageProxy = Boolean(proxyUrl);
        const status = postgresCheck.ok && redisCheck.ok && garageCheck.ok ? 'ok' : 'degraded';

        return {
            status,
            postgres: postgresCheck.ok,
            redis: redisCheck.ok,
            garage: garageCheck.ok,
            openAi: openAiCheck.ok,
            scraper: scraperCheck.ok,
            storageProxy,
            postgresError: postgresCheck.error,
            redisError: redisCheck.error,
            garageError: garageCheck.error,
            openAiError: openAiCheck.error,
            scraperUrl,
            scraperError: scraperCheck.error,
            storageProxyUrl: proxyUrl,
            storageProxyError: !proxyUrl ? 'GARAGE_PROXY_URL not configured' : undefined,
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            redisUrlConfigured: Boolean(process.env.REDIS_URL),
            garageConfigured: Boolean(process.env.GARAGE_ENDPOINT),
            openAiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
            database: postgresCheck.ok ? postgresCheck.database : undefined,
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

    private async checkOpenAi(): Promise<{ ok: boolean; error?: string }> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return { ok: false, error: 'OPENAI_API_KEY not configured' };
        }
        try {
            const openai = new OpenAI({ apiKey });
            // List models is the lightest call — no tokens consumed, just auth check
            await openai.models.list();
            return { ok: true };
        } catch (error) {
            return { ok: false, error: this.sanitizeError(error) };
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

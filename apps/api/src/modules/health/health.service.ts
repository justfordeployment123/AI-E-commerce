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
        postgresError?: string;
        redisError?: string;
        garageError?: string;
        openAiError?: string;
        databaseUrlConfigured: boolean;
        redisUrlConfigured: boolean;
        garageConfigured: boolean;
        openAiKeyConfigured: boolean;
        database?: { tableCount: number; tables: string[] };
        timestamp: string;
    }> {
        const [postgresCheck, redisCheck, garageCheck, openAiCheck] = await Promise.all([
            this.checkPostgres(),
            this.checkRedis(),
            this.checkGarage(),
            this.checkOpenAi(),
        ]);

        const postgres = postgresCheck.ok;
        const redis = redisCheck.ok;
        const garage = garageCheck.ok;
        const openAi = openAiCheck.ok;
        const status = postgres && redis && garage ? 'ok' : 'degraded';

        return {
            status,
            postgres,
            redis,
            garage,
            openAi,
            postgresError: postgresCheck.error,
            redisError: redisCheck.error,
            garageError: garageCheck.error,
            openAiError: openAiCheck.error,
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

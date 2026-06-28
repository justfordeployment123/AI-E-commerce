import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getStatus() {
        const postgresCheck = await this.checkPostgres();

        let lastRun: {
            id: string;
            status: string;
            startedAt: Date;
            finishedAt: Date | null;
            totalScraped: number | null;
            errorMessage: string | null;
        } | null = null;

        if (postgresCheck.ok) {
            try {
                lastRun = await this.prisma.scraperRun.findFirst({
                    orderBy: { startedAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        startedAt: true,
                        finishedAt: true,
                        totalScraped: true,
                        errorMessage: true,
                    },
                }) as typeof lastRun;
            } catch {
                // non-critical — health status already captured above
            }
        }

        return {
            status: postgresCheck.ok ? 'ok' : 'degraded',
            service: 'scraper',
            uptime: process.uptime(),
            hostname: os.hostname(),
            postgres: postgresCheck.ok,
            postgresError: postgresCheck.error,
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            database: postgresCheck.ok ? postgresCheck.database : undefined,
            lastRun: lastRun ?? undefined,
            timestamp: new Date().toISOString(),
        };
    }

    private async checkPostgres(): Promise<{
        ok: boolean;
        error?: string;
        database?: { tableCount: number; tables: string[] };
    }> {
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
            return { ok: false, error: this.sanitizeError(error) };
        }
    }

    private sanitizeError(error: unknown): string {
        if (error instanceof AggregateError && error.errors?.length) {
            const inner = error.errors
                .map((e: NodeJS.ErrnoException) => e.message || e.code || String(e))
                .join('; ');
            return `${error.message ? error.message + ': ' : ''}${inner}`;
        }
        if (error instanceof Error) {
            const base = error as NodeJS.ErrnoException;
            const parts = [base.message, base.code].filter(Boolean);
            const msg = parts.join(' ') || error.name || 'Unknown error';
            return msg.replace(/(postgres(?:ql)?:\/\/)[^\s@]+@/gi, '$1***:***@');
        }
        if (typeof error === 'string') return error;
        try { return JSON.stringify(error); } catch { return 'Unknown error'; }
    }
}

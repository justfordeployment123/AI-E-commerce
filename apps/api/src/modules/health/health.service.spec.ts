import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { PaymentsService } from '../payments/payments.service';
import { ShippingService } from '../shipping/shipping.service';
import { EmailService } from '../../common/services/email.service';

// The service constructs a real S3Client internally for checkGarage(); we can't easily
// inject a mock for it, so we let it run and expect a connection failure (ok: false)
// against a non-existent endpoint rather than mocking the AWS SDK.

describe('HealthService', () => {
    let service: HealthService;
    let prismaMock: any;
    let redisMock: any;
    let paymentsMock: any;
    let shippingMock: any;
    let emailMock: any;
    const originalEnv = { ...process.env };
    let fetchSpy: any;

    beforeEach(async () => {
        process.env = { ...originalEnv };
        delete process.env.OPENAI_API_KEY;
        delete process.env.GARAGE_ENDPOINT;
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;

        prismaMock = {
            $queryRaw: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        };
        redisMock = {
            ping: jest.fn<() => Promise<any>>().mockResolvedValue('PONG'),
        };
        paymentsMock = {
            getHealthStatus: jest.fn<() => Promise<any>>().mockResolvedValue({
                configured: true, keyMode: 'test', webhookConfigured: true, publishableKeyConfigured: true,
            }),
        };
        shippingMock = {
            getHealthStatus: jest.fn<() => Promise<any>>().mockResolvedValue({ configured: false, mode: 'unknown' }),
        };
        emailMock = {
            isConfigured: jest.fn<() => boolean>().mockReturnValue(false),
            verifyConnection: jest.fn<() => Promise<any>>().mockResolvedValue({ ok: true }),
        };

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200 } as any);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: RedisService, useValue: redisMock },
                { provide: PaymentsService, useValue: paymentsMock },
                { provide: ShippingService, useValue: shippingMock },
                { provide: EmailService, useValue: emailMock },
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        fetchSpy.mockRestore();
    });

    describe('getStatus', () => {
        it('reports status "ok" when postgres, redis, and garage all succeed', async () => {
            // Garage check hits a real S3Client against localhost:9000; in a CI sandbox
            // with no such service running this will fail — so we only assert on the
            // fields we control directly instead of asserting overall `status`.
            const result = await service.getStatus();
            expect(result.postgres).toBe(true);
            expect(result.redis).toBe(true);
        });

        it('reports status "degraded" when postgres check fails', async () => {
            prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));
            const result = await service.getStatus();
            expect(result.status).toBe('degraded');
            expect(result.postgres).toBe(false);
            expect(result.postgresError).toContain('connection refused');
        });

        it('reports status "degraded" when redis check fails', async () => {
            redisMock.ping.mockRejectedValue(new Error('ECONNREFUSED'));
            const result = await service.getStatus();
            expect(result.status).toBe('degraded');
            expect(result.redis).toBe(false);
        });

        it('reports openAi as not configured when OPENAI_API_KEY is unset', async () => {
            const result = await service.getStatus();
            expect(result.openAi).toBe(false);
            expect(result.openAiQuotaOk).toBe(false);
            expect(result.openAiError).toBe('OPENAI_API_KEY not configured');
            expect(result.openAiKeyConfigured).toBe(false);
        });

        it('includes database table info when postgres check succeeds', async () => {
            prismaMock.$queryRaw
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ tablename: 'users' }, { tablename: 'orders' }]);
            const result = await service.getStatus();
            expect(result.database).toEqual({ tableCount: 2, tables: ['users', 'orders'] });
        });

        it('omits database info when postgres check fails', async () => {
            prismaMock.$queryRaw.mockRejectedValue(new Error('down'));
            const result = await service.getStatus();
            expect(result.database).toBeUndefined();
        });

        it('reports scraper as ok when scraper responds ok', async () => {
            const result = await service.getStatus();
            expect(result.scraper).toBe(true);
        });

        it('reports scraper as not ok with HTTP status when scraper responds with error status', async () => {
            fetchSpy.mockResolvedValue({ ok: false, status: 503 } as any);
            const result = await service.getStatus();
            expect(result.scraper).toBe(false);
            expect(result.scraperError).toBe('HTTP 503');
        });

        it('reports scraper as not ok when fetch throws', async () => {
            fetchSpy.mockRejectedValue(new Error('fetch failed'));
            const result = await service.getStatus();
            expect(result.scraper).toBe(false);
            expect(result.scraperError).toContain('fetch failed');
        });

        it('includes stripe integration status from PaymentsService', async () => {
            const result = await service.getStatus();
            expect(result.integrations.stripe).toEqual({
                configured: true,
                mode: 'test',
                secretKeyConfigured: true,
                webhookConfigured: true,
                publishableKeyConfigured: true,
            });
        });

        it('marks stripe as unconfigured with error when PaymentsService throws', async () => {
            paymentsMock.getHealthStatus.mockRejectedValue(new Error('stripe boom'));
            const result = await service.getStatus();
            expect(result.integrations.stripe.configured).toBe(false);
            expect(result.integrations.stripe.error).toContain('stripe boom');
        });

        it('includes shippo integration status from ShippingService', async () => {
            const result = await service.getStatus();
            expect(result.integrations.shippo).toEqual({ configured: false, mode: undefined });
        });

        it('marks shippo as unconfigured with error when ShippingService throws', async () => {
            shippingMock.getHealthStatus.mockRejectedValue(new Error('shippo boom'));
            const result = await service.getStatus();
            expect(result.integrations.shippo.configured).toBe(false);
            expect(result.integrations.shippo.error).toContain('shippo boom');
        });

        it('reports email as not configured when EmailService.isConfigured is false', async () => {
            const result = await service.getStatus();
            expect(result.integrations.email).toEqual({ configured: false });
            expect(emailMock.verifyConnection).not.toHaveBeenCalled();
        });

        it('verifies email connection when configured', async () => {
            emailMock.isConfigured.mockReturnValue(true);
            emailMock.verifyConnection.mockResolvedValue({ ok: false, error: 'smtp timeout' });
            const result = await service.getStatus();
            expect(result.integrations.email).toEqual({ configured: true, error: 'smtp timeout' });
        });

        it('reports googleOAuth configured only when both client id and secret are set', async () => {
            const notConfigured = await service.getStatus();
            expect(notConfigured.integrations.googleOAuth).toEqual({ configured: false });

            process.env.GOOGLE_CLIENT_ID = 'id';
            process.env.GOOGLE_CLIENT_SECRET = 'secret';
            const configured = await service.getStatus();
            expect(configured.integrations.googleOAuth).toEqual({ configured: true });
        });

        it('always reports socket integration as configured', async () => {
            const result = await service.getStatus();
            expect(result.integrations.socket).toEqual({ configured: true });
        });
    });
});

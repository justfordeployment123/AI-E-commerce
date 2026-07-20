import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ScraperCronService } from './scraper-cron.service';
import { PrismaService } from '../database/prisma.service';
import { ProductPricingService } from '../product-pricing/product-pricing.service';

describe('ScraperCronService', () => {
    let service: ScraperCronService;
    let prismaMock: any;
    let productPricingMock: any;
    let fetchMock: jest.Mock<any>;
    let setIntervalSpy: jest.SpiedFunction<typeof global.setInterval>;
    let clearIntervalSpy: jest.SpiedFunction<typeof global.clearInterval>;

    beforeEach(async () => {
        jest.useFakeTimers();
        prismaMock = {
            pricingConfig: {
                findUnique: jest.fn<() => Promise<any>>().mockResolvedValue(null),
                upsert: jest.fn<() => Promise<any>>().mockResolvedValue({}),
            },
        };
        productPricingMock = {
            runPriceCatalog: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
            getJobStatus: jest.fn().mockReturnValue({ result: { applied: 1, flagged: 0 } }),
        };

        fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        setIntervalSpy = jest.spyOn(global, 'setInterval');
        clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScraperCronService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: ProductPricingService, useValue: productPricingMock },
            ],
        }).compile();

        service = module.get<ScraperCronService>(ScraperCronService);
    });

    afterEach(() => {
        service.onModuleDestroy();
        jest.useRealTimers();
        jest.restoreAllMocks();
        delete (global as any).fetch;
    });

    describe('onModuleInit', () => {
        it('defaults to 1 hour and starts an interval when there is no saved config row', async () => {
            await service.onModuleInit();
            expect(service.getSchedule()).toEqual({ hours: 1 });
            expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        });

        it('uses the saved hours value from the DB', async () => {
            prismaMock.pricingConfig.findUnique.mockResolvedValueOnce({ value: 6 });
            await service.onModuleInit();
            expect(service.getSchedule()).toEqual({ hours: 6 });
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 6 * 60 * 60 * 1000);
        });

        it('does not start an interval when the saved schedule is 0 (disabled)', async () => {
            prismaMock.pricingConfig.findUnique.mockResolvedValueOnce({ value: 0 });
            await service.onModuleInit();
            expect(service.getSchedule()).toEqual({ hours: 0 });
            expect(setIntervalSpy).not.toHaveBeenCalled();
        });

        it('falls back to default hours when the DB read fails', async () => {
            prismaMock.pricingConfig.findUnique.mockRejectedValueOnce(new Error('db down'));
            await service.onModuleInit();
            expect(service.getSchedule()).toEqual({ hours: 1 });
        });
    });

    describe('setSchedule', () => {
        it('throws for a negative value', async () => {
            await expect(service.setSchedule(-1)).rejects.toThrow('Hours must be a non-negative integer.');
        });

        it('throws for a NaN value', async () => {
            await expect(service.setSchedule(NaN)).rejects.toThrow('Hours must be a non-negative integer.');
        });

        it('floors fractional hours and persists via upsert', async () => {
            const result = await service.setSchedule(2.9);
            expect(result).toEqual({ hours: 2 });
            expect(prismaMock.pricingConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { key: 'scraper_schedule_hours' },
                update: expect.objectContaining({ value: 2 }),
            }));
        });

        it('starts a new interval when set to a positive value', async () => {
            await service.setSchedule(3);
            expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 3 * 60 * 60 * 1000);
        });

        it('stops any existing interval when set to 0', async () => {
            await service.setSchedule(3);
            await service.setSchedule(0);
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(service.getSchedule()).toEqual({ hours: 0 });
        });

        it('clears the previous interval before starting a new one on reschedule', async () => {
            await service.setSchedule(3);
            await service.setSchedule(5);
            expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
            expect(setIntervalSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('scheduled scraper cycle (interval callback)', () => {
        it('triggers the scraper, waits, then runs auto-pricing on success', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true });
            await service.setSchedule(1);
            const callback = setIntervalSpy.mock.calls[0]![0] as () => Promise<void>;

            const cyclePromise = callback();
            await jest.advanceTimersByTimeAsync(30_000);
            await cyclePromise;

            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/scraper/run'), { method: 'POST' });
            expect(productPricingMock.runPriceCatalog).toHaveBeenCalled();
        });

        it('logs and swallows errors when the scraper fetch fails, without crashing', async () => {
            fetchMock.mockRejectedValueOnce(new Error('scraper unreachable'));
            await service.setSchedule(1);
            const callback = setIntervalSpy.mock.calls[0]![0] as () => Promise<void>;

            await expect(callback()).resolves.toBeUndefined();
            expect(productPricingMock.runPriceCatalog).not.toHaveBeenCalled();
        });

        it('logs and swallows errors when auto-pricing itself fails', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true });
            productPricingMock.runPriceCatalog.mockRejectedValueOnce(new Error('pricing failed'));
            await service.setSchedule(1);
            const callback = setIntervalSpy.mock.calls[0]![0] as () => Promise<void>;

            const cyclePromise = callback();
            await jest.advanceTimersByTimeAsync(30_000);
            await expect(cyclePromise).resolves.toBeUndefined();
        });
    });
});

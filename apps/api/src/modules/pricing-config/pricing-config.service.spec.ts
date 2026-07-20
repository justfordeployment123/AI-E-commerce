import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PricingConfigService } from './pricing-config.service';
import { PrismaService } from '../database/prisma.service';

function makeConfig(overrides: Partial<any> = {}) {
    return { key: 'multiplier_new', value: 1.2, label: 'New condition multiplier (% of market price)', ...overrides };
}

describe('PricingConfigService', () => {
    let service: PricingConfigService;
    let prismaMock: any;

    beforeEach(async () => {
        prismaMock = {
            pricingConfig: {
                findMany: jest.fn<() => Promise<any>>(),
                createMany: jest.fn<() => Promise<any>>().mockResolvedValue({ count: 0 }),
                upsert: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PricingConfigService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<PricingConfigService>(PricingConfigService);
    });

    describe('findAll', () => {
        it('returns stored config as-is when all 9 defaults are already present', async () => {
            const allKeys = [
                'multiplier_new', 'multiplier_a', 'multiplier_b', 'multiplier_c', 'multiplier_f',
                'sell_margin_pct', 'sell_discount_pct', 'tradein_ratio', 'tradein_margin_pct',
            ];
            const stored = allKeys.map((key) => makeConfig({ key }));
            prismaMock.pricingConfig.findMany.mockResolvedValueOnce(stored);

            const result = await service.findAll();

            expect(result).toEqual(stored);
            expect(prismaMock.pricingConfig.createMany).not.toHaveBeenCalled();
        });

        it('seeds missing defaults and re-fetches when config table is empty', async () => {
            prismaMock.pricingConfig.findMany
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([makeConfig()]);

            const result = await service.findAll();

            expect(prismaMock.pricingConfig.createMany).toHaveBeenCalledTimes(1);
            const seedData = (prismaMock.pricingConfig.createMany as any).mock.calls[0][0].data;
            expect(seedData).toHaveLength(9);
            expect(seedData.map((d: any) => d.key)).toContain('multiplier_new');
            expect(result).toEqual([makeConfig()]);
        });

        it('seeds only the specific keys that are missing', async () => {
            const existingKeys = [
                'multiplier_new', 'multiplier_a', 'multiplier_b', 'multiplier_c', 'multiplier_f',
                'sell_margin_pct', 'sell_discount_pct', 'tradein_ratio',
                // 'tradein_margin_pct' intentionally missing
            ];
            const stored = existingKeys.map((key) => makeConfig({ key }));
            prismaMock.pricingConfig.findMany
                .mockResolvedValueOnce(stored)
                .mockResolvedValueOnce([...stored, makeConfig({ key: 'tradein_margin_pct', value: 0 })]);

            await service.findAll();

            const seedData = (prismaMock.pricingConfig.createMany as any).mock.calls[0][0].data;
            expect(seedData).toHaveLength(1);
            expect(seedData[0].key).toBe('tradein_margin_pct');
        });
    });

    describe('upsert', () => {
        it('upserts the config by key with the provided value and label', async () => {
            const dto = { value: 1.5, label: 'Updated label' } as any;
            prismaMock.pricingConfig.upsert.mockResolvedValueOnce(makeConfig({ value: 1.5, label: 'Updated label' }));

            const result = await service.upsert('multiplier_new', dto);

            expect(prismaMock.pricingConfig.upsert).toHaveBeenCalledWith({
                where: { key: 'multiplier_new' },
                update: { value: 1.5, label: 'Updated label' },
                create: { key: 'multiplier_new', value: 1.5, label: 'Updated label' },
            });
            expect(result.value).toBe(1.5);
        });
    });

    describe('remove', () => {
        it('deletes the config entry by key', async () => {
            prismaMock.pricingConfig.delete.mockResolvedValueOnce(makeConfig());
            const result = await service.remove('multiplier_new');
            expect(prismaMock.pricingConfig.delete).toHaveBeenCalledWith({ where: { key: 'multiplier_new' } });
            expect(result).toEqual({ message: 'Config removed' });
        });
    });
});

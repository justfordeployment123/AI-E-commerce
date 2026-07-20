import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { TradeInDevicesService } from './trade-in-devices.service';
import { PrismaService } from '../database/prisma.service';

function makeDevice(overrides: Partial<any> = {}) {
    return {
        id: 'device-1',
        name: 'iPhone 13',
        brand: 'Apple',
        category: 'Phones',
        isActive: true,
        ...overrides,
    };
}

describe('TradeInDevicesService', () => {
    let service: TradeInDevicesService;
    let prismaMock: any;

    beforeEach(async () => {
        prismaMock = {
            tradeInDevice: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                upsert: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TradeInDevicesService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<TradeInDevicesService>(TradeInDevicesService);
    });

    describe('findAll', () => {
        it('does not filter by isActive when activeOnly is false (default)', async () => {
            await service.findAll();
            expect(prismaMock.tradeInDevice.findMany).toHaveBeenCalledWith({
                where: undefined,
                orderBy: [{ category: 'asc' }, { brand: 'asc' }, { name: 'asc' }],
            });
        });

        it('filters by isActive when activeOnly is true', async () => {
            await service.findAll(true);
            expect(prismaMock.tradeInDevice.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: [{ category: 'asc' }, { brand: 'asc' }, { name: 'asc' }],
            });
        });
    });

    describe('create', () => {
        it('upserts on brand+name, defaulting isActive to true when omitted', async () => {
            const dto = { name: 'iPhone 13', brand: 'Apple', category: 'Phones' };
            const created = makeDevice();
            prismaMock.tradeInDevice.upsert.mockResolvedValueOnce(created);

            const result = await service.create(dto);

            expect(prismaMock.tradeInDevice.upsert).toHaveBeenCalledWith({
                where: { brand_name: { brand: 'Apple', name: 'iPhone 13' } },
                update: { category: 'Phones', isActive: true },
                create: { name: 'iPhone 13', brand: 'Apple', category: 'Phones', isActive: true },
            });
            expect(result).toBe(created);
        });

        it('respects an explicit isActive value', async () => {
            const dto = { name: 'iPhone 13', brand: 'Apple', category: 'Phones', isActive: false };
            await service.create(dto);
            const call = prismaMock.tradeInDevice.upsert.mock.calls[0][0];
            expect(call.create.isActive).toBe(false);
            expect(call.update.isActive).toBe(false);
        });
    });

    describe('update', () => {
        it('throws NotFoundException when the device does not exist', async () => {
            prismaMock.tradeInDevice.findUnique.mockResolvedValueOnce(null);
            await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
            expect(prismaMock.tradeInDevice.update).not.toHaveBeenCalled();
        });

        it('updates the device when it exists', async () => {
            prismaMock.tradeInDevice.findUnique.mockResolvedValueOnce(makeDevice());
            const updated = makeDevice({ name: 'iPhone 13 Pro' });
            prismaMock.tradeInDevice.update.mockResolvedValueOnce(updated);
            const result = await service.update('device-1', { name: 'iPhone 13 Pro' });
            expect(prismaMock.tradeInDevice.update).toHaveBeenCalledWith({ where: { id: 'device-1' }, data: { name: 'iPhone 13 Pro' } });
            expect(result).toBe(updated);
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when the device does not exist', async () => {
            prismaMock.tradeInDevice.findUnique.mockResolvedValueOnce(null);
            await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
            expect(prismaMock.tradeInDevice.delete).not.toHaveBeenCalled();
        });

        it('deletes the device when it exists', async () => {
            prismaMock.tradeInDevice.findUnique.mockResolvedValueOnce(makeDevice());
            const deleted = makeDevice();
            prismaMock.tradeInDevice.delete.mockResolvedValueOnce(deleted);
            const result = await service.remove('device-1');
            expect(prismaMock.tradeInDevice.delete).toHaveBeenCalledWith({ where: { id: 'device-1' } });
            expect(result).toBe(deleted);
        });
    });

    describe('bulkCreate', () => {
        it('calls create for every device and returns all results', async () => {
            const devices = [
                { name: 'iPhone 13', brand: 'Apple', category: 'Phones' },
                { name: 'Galaxy S21', brand: 'Samsung', category: 'Phones' },
            ];
            prismaMock.tradeInDevice.upsert
                .mockResolvedValueOnce(makeDevice({ id: 'd1' }))
                .mockResolvedValueOnce(makeDevice({ id: 'd2', brand: 'Samsung' }));

            const result = await service.bulkCreate(devices);

            expect(prismaMock.tradeInDevice.upsert).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { PrismaService } from '../database/prisma.service';

function makeStore(overrides: Partial<any> = {}) {
    return {
        id: 'store-1',
        name: 'TechStop Leicester',
        address: '1 High Street',
        city: 'Leicester',
        postcode: 'LE1 1AA',
        phone: '0116 000 0000',
        isActive: true,
        ...overrides,
    };
}

describe('StoresService', () => {
    let service: StoresService;
    let prismaMock: any;

    beforeEach(async () => {
        prismaMock = {
            store: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StoresService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<StoresService>(StoresService);
    });

    describe('findAllActive', () => {
        it('queries only active stores ordered by name', async () => {
            const stores = [makeStore()];
            prismaMock.store.findMany.mockResolvedValueOnce(stores);
            const result = await service.findAllActive();
            expect(prismaMock.store.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            });
            expect(result).toBe(stores);
        });
    });

    describe('findAll', () => {
        it('queries all stores ordered by name', async () => {
            const stores = [makeStore(), makeStore({ id: 'store-2' })];
            prismaMock.store.findMany.mockResolvedValueOnce(stores);
            const result = await service.findAll();
            expect(prismaMock.store.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
            expect(result).toBe(stores);
        });
    });

    describe('findById', () => {
        it('throws NotFoundException when store does not exist', async () => {
            prismaMock.store.findUnique.mockResolvedValueOnce(null);
            await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the store when found', async () => {
            const store = makeStore();
            prismaMock.store.findUnique.mockResolvedValueOnce(store);
            const result = await service.findById('store-1');
            expect(result).toBe(store);
        });
    });

    describe('create', () => {
        it('creates a store with the given dto', async () => {
            const dto = { name: 'New Store', address: '2 High Street', city: 'Leicester', postcode: 'LE1 1AB' };
            const created = makeStore(dto);
            prismaMock.store.create.mockResolvedValueOnce(created);
            const result = await service.create(dto as any);
            expect(prismaMock.store.create).toHaveBeenCalledWith({ data: dto });
            expect(result).toBe(created);
        });
    });

    describe('update', () => {
        it('throws NotFoundException when the store does not exist', async () => {
            prismaMock.store.findUnique.mockResolvedValueOnce(null);
            await expect(service.update('missing', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
            expect(prismaMock.store.update).not.toHaveBeenCalled();
        });

        it('updates the store when it exists', async () => {
            prismaMock.store.findUnique.mockResolvedValueOnce(makeStore());
            const updated = makeStore({ name: 'Updated Name' });
            prismaMock.store.update.mockResolvedValueOnce(updated);
            const result = await service.update('store-1', { name: 'Updated Name' } as any);
            expect(prismaMock.store.update).toHaveBeenCalledWith({ where: { id: 'store-1' }, data: { name: 'Updated Name' } });
            expect(result).toBe(updated);
        });
    });

    describe('remove', () => {
        it('throws NotFoundException when the store does not exist', async () => {
            prismaMock.store.findUnique.mockResolvedValueOnce(null);
            await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
            expect(prismaMock.store.delete).not.toHaveBeenCalled();
        });

        it('deletes the store and returns a confirmation message', async () => {
            prismaMock.store.findUnique.mockResolvedValueOnce(makeStore());
            const result = await service.remove('store-1');
            expect(prismaMock.store.delete).toHaveBeenCalledWith({ where: { id: 'store-1' } });
            expect(result).toEqual({ message: 'Store deleted' });
        });
    });
});

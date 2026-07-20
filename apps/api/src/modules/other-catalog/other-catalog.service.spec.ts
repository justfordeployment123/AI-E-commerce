import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { OtherCatalogService } from './other-catalog.service';
import { PrismaService } from '../database/prisma.service';

describe('OtherCatalogService', () => {
    let service: OtherCatalogService;
    let prismaMock: any;

    beforeEach(async () => {
        prismaMock = {
            otherBrand: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            otherSubcategory: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            product: {
                count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OtherCatalogService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<OtherCatalogService>(OtherCatalogService);
    });

    describe('listBrands', () => {
        it('lists brands ordered by name', async () => {
            const brands = [{ id: 'b1', name: 'Acme' }];
            prismaMock.otherBrand.findMany.mockResolvedValueOnce(brands);
            const result = await service.listBrands();
            expect(prismaMock.otherBrand.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
            expect(result).toEqual(brands);
        });
    });

    describe('createBrand', () => {
        it('trims the name before creating', async () => {
            prismaMock.otherBrand.create.mockResolvedValueOnce({ id: 'b1', name: 'Acme' });
            await service.createBrand({ name: '  Acme  ' } as any);
            expect(prismaMock.otherBrand.create).toHaveBeenCalledWith({ data: { name: 'Acme' } });
        });
    });

    describe('updateBrand', () => {
        it('trims the name before updating', async () => {
            prismaMock.otherBrand.update.mockResolvedValueOnce({ id: 'b1', name: 'New' });
            await service.updateBrand('b1', { name: ' New ' } as any);
            expect(prismaMock.otherBrand.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { name: 'New' } });
        });

        it('handles undefined name gracefully', async () => {
            prismaMock.otherBrand.update.mockResolvedValueOnce({ id: 'b1' });
            await service.updateBrand('b1', {} as any);
            expect(prismaMock.otherBrand.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { name: undefined } });
        });
    });

    describe('deleteBrand', () => {
        it('throws BadRequestException when products still reference the brand', async () => {
            prismaMock.product.count.mockResolvedValueOnce(2);
            await expect(service.deleteBrand('b1')).rejects.toThrow(BadRequestException);
            expect(prismaMock.otherBrand.delete).not.toHaveBeenCalled();
        });

        it('deletes the brand when no products reference it', async () => {
            prismaMock.product.count.mockResolvedValueOnce(0);
            const result = await service.deleteBrand('b1');
            expect(prismaMock.otherBrand.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
            expect(result).toEqual({ message: 'Deleted' });
        });
    });

    describe('listSubcategories', () => {
        it('lists subcategories ordered by name', async () => {
            const subs = [{ id: 's1', name: 'Cables' }];
            prismaMock.otherSubcategory.findMany.mockResolvedValueOnce(subs);
            const result = await service.listSubcategories();
            expect(prismaMock.otherSubcategory.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
            expect(result).toEqual(subs);
        });
    });

    describe('createSubcategory', () => {
        it('trims the name before creating', async () => {
            prismaMock.otherSubcategory.create.mockResolvedValueOnce({ id: 's1', name: 'Cables' });
            await service.createSubcategory({ name: '  Cables  ' } as any);
            expect(prismaMock.otherSubcategory.create).toHaveBeenCalledWith({ data: { name: 'Cables' } });
        });
    });

    describe('updateSubcategory', () => {
        it('trims the name before updating', async () => {
            prismaMock.otherSubcategory.update.mockResolvedValueOnce({ id: 's1', name: 'New' });
            await service.updateSubcategory('s1', { name: ' New ' } as any);
            expect(prismaMock.otherSubcategory.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { name: 'New' } });
        });
    });

    describe('deleteSubcategory', () => {
        it('throws BadRequestException when products still reference the subcategory', async () => {
            prismaMock.product.count.mockResolvedValueOnce(5);
            await expect(service.deleteSubcategory('s1')).rejects.toThrow(BadRequestException);
            expect(prismaMock.otherSubcategory.delete).not.toHaveBeenCalled();
        });

        it('deletes the subcategory when no products reference it', async () => {
            prismaMock.product.count.mockResolvedValueOnce(0);
            const result = await service.deleteSubcategory('s1');
            expect(prismaMock.otherSubcategory.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
            expect(result).toEqual({ message: 'Deleted' });
        });
    });
});

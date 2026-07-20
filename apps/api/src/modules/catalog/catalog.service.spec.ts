import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

function makeCategory(overrides: Partial<any> = {}) {
    return { id: 'cat-1', name: 'Phones', image: null, images: [], isActive: true, ...overrides };
}

function makeBrand(overrides: Partial<any> = {}) {
    return { id: 'brand-1', name: 'Apple', slug: 'apple', logo: null, isActive: true, ...overrides };
}

function makeBrandCategory(overrides: Partial<any> = {}) {
    return {
        id: 'bc-1',
        brandId: 'brand-1',
        categoryId: 'cat-1',
        images: [] as string[],
        isActive: true,
        brand: makeBrand(),
        category: makeCategory(),
        ...overrides,
    };
}

describe('CatalogService', () => {
    let service: CatalogService;
    let prismaMock: any;
    let storageMock: any;

    beforeEach(async () => {
        prismaMock = {
            category: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            brand: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            brandCategory: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                upsert: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            product: {
                count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
                findFirst: jest.fn<() => Promise<any>>().mockResolvedValue(null),
            },
            deviceCatalog: {
                count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            },
        };
        storageMock = {
            resolveImageUrl: jest.fn<(k: any) => Promise<string | null>>().mockImplementation(async (k: any) => (k ? `https://cdn/${k}` : null)),
            uploadFile: jest.fn<() => Promise<any>>().mockResolvedValue({ filePath: 'catalog/new.png', url: 'https://cdn/new.png' }),
            buildKey: jest.fn().mockImplementation((folder: any, filename: any) => `${folder}/uuid-${filename}`),
            presignPut: jest.fn<() => Promise<string>>().mockResolvedValue('https://upload-url'),
            generatePresignedUrl: jest.fn<() => Promise<string>>().mockResolvedValue('https://view-url'),
            deleteFiles: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CatalogService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: StorageService, useValue: storageMock },
            ],
        }).compile();

        service = module.get<CatalogService>(CatalogService);
    });

    // ─── Categories ──────────────────────────────────────────────────────────

    describe('listCategories()', () => {
        it('computes a lowercase slug and attaches product/model counts + min price', async () => {
            prismaMock.category.findMany.mockResolvedValueOnce([
                { ...makeCategory({ name: 'Phones', id: 'cat-1' }), _count: { brandCategories: 2 } },
            ]);
            prismaMock.product.count.mockResolvedValueOnce(5);
            prismaMock.product.findFirst.mockResolvedValueOnce({ price: 199.99 });
            prismaMock.deviceCatalog.count.mockResolvedValueOnce(3);

            const results = await service.listCategories();
            const result = results[0]!;

            expect(result.slug).toBe('phones');
            expect(result.productCount).toBe(5);
            expect(result.minPrice).toBe(199.99);
            expect(result.modelCount).toBe(3);
        });

        it('uses isActive filter unless includeInactive is passed', async () => {
            await service.listCategories();
            expect(prismaMock.category.findMany.mock.calls[0]![0]).toMatchObject({ where: { isActive: true } });

            await service.listCategories(true);
            expect(prismaMock.category.findMany.mock.calls[1]![0]).toMatchObject({ where: {} });
        });
    });

    describe('getCategory()', () => {
        it('throws NotFoundException when the category does not exist', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(null);
            await expect(service.getCategory('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the category when found', async () => {
            const cat = makeCategory();
            prismaMock.category.findUnique.mockResolvedValueOnce(cat);
            await expect(service.getCategory('cat-1')).resolves.toBe(cat);
        });
    });

    describe('saveCategoryImageKey()', () => {
        it('sets the new key as primary image when none was set before', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(makeCategory({ image: null, images: [] }));
            await service.saveCategoryImageKey('cat-1', 'new-key.png');
            const call = prismaMock.category.update.mock.calls[0]![0] as any;
            expect(call.data.image).toBe('new-key.png');
            expect(call.data.images).toEqual(['new-key.png']);
        });

        it('keeps the existing primary image and dedupes the images array', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(
                makeCategory({ image: 'existing.png', images: ['existing.png'] }),
            );
            await service.saveCategoryImageKey('cat-1', 'existing.png');
            const call = prismaMock.category.update.mock.calls[0]![0] as any;
            expect(call.data.image).toBe('existing.png');
            expect(call.data.images).toEqual(['existing.png']);
        });
    });

    describe('deleteCategoryImage()', () => {
        it('picks the next remaining image as primary when the primary image is deleted', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(
                makeCategory({ image: 'a.png', images: ['a.png', 'b.png'] }),
            );
            await service.deleteCategoryImage('cat-1', 'a.png');
            const call = prismaMock.category.update.mock.calls[0]![0] as any;
            expect(call.data.image).toBe('b.png');
            expect(call.data.images).toEqual(['b.png']);
        });

        it('sets primary to null when deleting the only image', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(
                makeCategory({ image: 'a.png', images: ['a.png'] }),
            );
            await service.deleteCategoryImage('cat-1', 'a.png');
            const call = prismaMock.category.update.mock.calls[0]![0] as any;
            expect(call.data.image).toBeNull();
        });

        it('leaves the primary image untouched when deleting a non-primary image', async () => {
            prismaMock.category.findUnique.mockResolvedValueOnce(
                makeCategory({ image: 'a.png', images: ['a.png', 'b.png'] }),
            );
            await service.deleteCategoryImage('cat-1', 'b.png');
            const call = prismaMock.category.update.mock.calls[0]![0] as any;
            expect(call.data.image).toBe('a.png');
            expect(call.data.images).toEqual(['a.png']);
        });
    });

    describe('createCategory()', () => {
        it('creates the category', async () => {
            prismaMock.category.create.mockResolvedValueOnce(makeCategory());
            const dto = { name: 'Phones' } as any;
            await service.createCategory(dto);
            expect(prismaMock.category.create).toHaveBeenCalledWith({ data: dto });
        });
    });

    // ─── Brands ──────────────────────────────────────────────────────────────

    describe('getBrand()', () => {
        it('throws NotFoundException when the brand does not exist', async () => {
            prismaMock.brand.findUnique.mockResolvedValueOnce(null);
            await expect(service.getBrand('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getBrandBySlug()', () => {
        it('throws NotFoundException when the brand does not exist', async () => {
            prismaMock.brand.findUnique.mockResolvedValueOnce(null);
            await expect(service.getBrandBySlug('missing')).rejects.toThrow(NotFoundException);
        });

        it('resolves logo and nested category/brandCategory images', async () => {
            prismaMock.brand.findUnique.mockResolvedValueOnce({
                ...makeBrand({ logo: 'logo.png' }),
                brandCategories: [
                    {
                        ...makeBrandCategory({ images: ['img1.png'] }),
                        category: makeCategory({ image: 'cat.png' }),
                    },
                ],
            });

            const result = await service.getBrandBySlug('apple');

            expect(result.logo).toBe('https://cdn/logo.png');
            expect(result.brandCategories[0]!.category.image).toBe('https://cdn/cat.png');
            expect(result.brandCategories[0]!.images).toEqual(['https://cdn/img1.png']);
        });
    });

    describe('listBrands()', () => {
        it('attaches resolved logo urls and product counts', async () => {
            prismaMock.brand.findMany.mockResolvedValueOnce([
                { ...makeBrand({ logo: 'logo.png' }), _count: { brandCategories: 1 } },
            ]);
            prismaMock.product.count.mockResolvedValueOnce(9);

            const results = await service.listBrands();
            const result = results[0]!;

            expect(result.logo).toBe('https://cdn/logo.png');
            expect(result.productCount).toBe(9);
        });
    });

    // ─── Brand-Categories ────────────────────────────────────────────────────

    describe('listBrandCategories()', () => {
        it('filters by brandId when provided', async () => {
            await service.listBrandCategories(false, 'brand-1');
            const call = prismaMock.brandCategory.findMany.mock.calls[0]![0] as any;
            expect(call.where).toEqual({ isActive: true, brandId: 'brand-1' });
        });

        it('includes inactive rows when includeInactive is true', async () => {
            await service.listBrandCategories(true);
            const call = prismaMock.brandCategory.findMany.mock.calls[0]![0] as any;
            expect(call.where).toEqual({});
        });
    });

    describe('getBrandCategory()', () => {
        it('throws NotFoundException when not found', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(null);
            await expect(service.getBrandCategory('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createBrandCategory()', () => {
        it('upserts using the composite brandId_categoryId key', async () => {
            prismaMock.brandCategory.upsert.mockResolvedValueOnce(makeBrandCategory());
            const dto = { brandId: 'brand-1', categoryId: 'cat-1' } as any;

            await service.createBrandCategory(dto);

            expect(prismaMock.brandCategory.upsert).toHaveBeenCalledWith({
                where: { brandId_categoryId: { brandId: 'brand-1', categoryId: 'cat-1' } },
                create: { ...dto, images: [] },
                update: { isActive: true },
                include: { brand: true, category: true },
            });
        });
    });

    describe('image-limit guarded methods (MAX_BRAND_CATEGORY_IMAGES = 10)', () => {
        function bcWithNImages(n: number) {
            return makeBrandCategory({ images: Array.from({ length: n }, (_, i) => `img${i}.png`) });
        }

        it('uploadBrandCategoryImage throws BadRequestException when already at the limit', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(bcWithNImages(10));
            await expect(service.uploadBrandCategoryImage('bc-1', { originalname: 'x.png' })).rejects.toThrow(
                BadRequestException,
            );
        });

        it('uploadBrandCategoryImage succeeds when under the limit', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(bcWithNImages(2));
            prismaMock.brandCategory.update.mockResolvedValueOnce(makeBrandCategory());
            await expect(
                service.uploadBrandCategoryImage('bc-1', { originalname: 'x.png' }),
            ).resolves.toBeDefined();
        });

        it('presignBrandCategoryImage throws BadRequestException at the limit', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(bcWithNImages(10));
            await expect(service.presignBrandCategoryImage('bc-1', 'x.png', 'image/png')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('saveBrandCategoryImageKey throws BadRequestException at the limit', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(bcWithNImages(10));
            await expect(service.saveBrandCategoryImageKey('bc-1', 'x.png')).rejects.toThrow(BadRequestException);
        });

        it('saveBrandCategoryImageKey appends the key when under the limit', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(bcWithNImages(1));
            prismaMock.brandCategory.update.mockImplementationOnce(async (args: any) => ({ ...makeBrandCategory(), ...args.data }));
            await service.saveBrandCategoryImageKey('bc-1', 'new.png');
            const call = prismaMock.brandCategory.update.mock.calls[0]![0] as any;
            expect(call.data.images).toEqual(['img0.png', 'new.png']);
        });
    });

    describe('deleteBrandCategoryImage()', () => {
        it('throws NotFoundException when the image key is not present on the record', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(makeBrandCategory({ images: ['a.png'] }));
            await expect(service.deleteBrandCategoryImage('bc-1', 'missing.png')).rejects.toThrow(NotFoundException);
        });

        it('decodes URI-encoded keys before comparing and deletes the matching image', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(
                makeBrandCategory({ images: ['folder/a b.png'] }),
            );
            prismaMock.brandCategory.update.mockResolvedValueOnce(makeBrandCategory({ images: [] }));

            await service.deleteBrandCategoryImage('bc-1', encodeURIComponent('folder/a b.png'));

            expect(storageMock.deleteFiles).toHaveBeenCalledWith(['folder/a b.png']);
            const call = prismaMock.brandCategory.update.mock.calls[0]![0] as any;
            expect(call.data.images).toEqual([]);
        });
    });

    describe('deleteBrandCategory()', () => {
        it('deletes associated storage files when images exist', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(makeBrandCategory({ images: ['a.png'] }));
            await service.deleteBrandCategory('bc-1');
            expect(storageMock.deleteFiles).toHaveBeenCalledWith(['a.png']);
            expect(prismaMock.brandCategory.delete).toHaveBeenCalledWith({ where: { id: 'bc-1' } });
        });

        it('skips storage deletion when there are no images', async () => {
            prismaMock.brandCategory.findUnique.mockResolvedValueOnce(makeBrandCategory({ images: [] }));
            await service.deleteBrandCategory('bc-1');
            expect(storageMock.deleteFiles).not.toHaveBeenCalled();
        });
    });

    // ─── Public: brand page products ────────────────────────────────────────

    describe('getBrandProducts()', () => {
        it('throws NotFoundException when the brand does not exist', async () => {
            prismaMock.brand.findUnique.mockResolvedValueOnce(null);
            await expect(service.getBrandProducts('missing')).rejects.toThrow(NotFoundException);
        });

        it('resolves nested product images across brandCategories/deviceCatalogs', async () => {
            prismaMock.brand.findUnique.mockResolvedValueOnce({
                ...makeBrand({ logo: 'logo.png' }),
                brandCategories: [
                    {
                        ...makeBrandCategory(),
                        deviceCatalogs: [
                            {
                                id: 'dc-1',
                                products: [{ id: 'p-1', images: ['p1.png'] }],
                            },
                        ],
                    },
                ],
            });

            const result = await service.getBrandProducts('apple');

            expect(result.logo).toBe('https://cdn/logo.png');
            expect(result.brandCategories[0]!.deviceCatalogs[0]!.products[0]!.images).toEqual(['https://cdn/p1.png']);
        });
    });
});

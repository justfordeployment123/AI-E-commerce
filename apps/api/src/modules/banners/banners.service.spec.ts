import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BannersService } from './banners.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

function makeBanner(overrides: Partial<any> = {}) {
    return { id: 'b-1', key: 'banners/a.png', label: 'Sale', isActive: true, order: 0, ...overrides };
}

function makeSlide(overrides: Partial<any> = {}) {
    return {
        id: 's-1',
        order: 0,
        isActive: true,
        imgKey: 'banners/promo/a.png',
        tabTitle: 'Tab',
        tag: 'New',
        titleLine1: 'Line1',
        titleLine2: 'Line2',
        titleItalic: 'Italic',
        title: 'Title',
        subtitle: 'Subtitle',
        badgeA: 'A',
        badgeB: 'B',
        specs: 'spec1, spec2 ,spec3',
        themeColor: '#fff',
        bgGlow: '#000',
        btnText: 'Shop',
        btnLink: '/shop',
        layoutTheme: 'system',
        ...overrides,
    };
}

describe('BannersService', () => {
    let service: BannersService;
    let prismaMock: any;
    let storageMock: any;

    beforeEach(async () => {
        prismaMock = {
            banner: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUniqueOrThrow: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            gradeBanner: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUniqueOrThrow: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
            promoSlide: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUniqueOrThrow: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
            },
        };
        storageMock = {
            resolveImageUrl: jest.fn<(k: string) => Promise<string>>().mockImplementation(async (k: any) => `https://cdn/${k}`),
            uploadFile: jest.fn<() => Promise<any>>().mockResolvedValue({ filePath: 'banners/new.png', url: 'https://cdn/new.png' }),
            buildKey: jest.fn().mockImplementation((folder: any, filename: any) => `${folder}/uuid-${filename}`),
            presignPut: jest.fn<() => Promise<string>>().mockResolvedValue('https://upload-url'),
            generatePresignedUrl: jest.fn<() => Promise<string>>().mockResolvedValue('https://view-url'),
            deleteFiles: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BannersService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: StorageService, useValue: storageMock },
            ],
        }).compile();

        service = module.get<BannersService>(BannersService);
    });

    describe('getRandom()', () => {
        it('returns an empty array when there are no active banners', async () => {
            prismaMock.banner.findMany.mockResolvedValueOnce([]);
            const result = await service.getRandom();
            expect(result).toEqual([]);
        });

        it('caps the number of returned banners at the requested count', async () => {
            const active = [makeBanner({ id: 'b1' }), makeBanner({ id: 'b2' }), makeBanner({ id: 'b3' })];
            prismaMock.banner.findMany.mockResolvedValueOnce(active);

            const result = await service.getRandom(2);

            expect(result).toHaveLength(2);
            for (const item of result) {
                expect(item).toHaveProperty('url');
                expect(item.url).toMatch(/^https:\/\/cdn\//);
            }
        });
    });

    describe('toggleBanner()', () => {
        it('flips isActive from true to false', async () => {
            prismaMock.banner.findUniqueOrThrow.mockResolvedValueOnce(makeBanner({ isActive: true }));
            await service.toggleBanner('b-1');
            expect(prismaMock.banner.update).toHaveBeenCalledWith({ where: { id: 'b-1' }, data: { isActive: false } });
        });

        it('flips isActive from false to true', async () => {
            prismaMock.banner.findUniqueOrThrow.mockResolvedValueOnce(makeBanner({ isActive: false }));
            await service.toggleBanner('b-1');
            expect(prismaMock.banner.update).toHaveBeenCalledWith({ where: { id: 'b-1' }, data: { isActive: true } });
        });
    });

    describe('uploadBanner()', () => {
        it('uploads the file and creates a banner record', async () => {
            prismaMock.banner.create.mockResolvedValueOnce(makeBanner({ key: 'banners/new.png' }));

            const result = await service.uploadBanner({ originalname: 'a.png' }, 'My Label');

            expect(storageMock.uploadFile).toHaveBeenCalledWith({ originalname: 'a.png' }, 'banners');
            expect(prismaMock.banner.create).toHaveBeenCalledWith({
                data: { key: 'banners/new.png', label: 'My Label', isActive: true, order: 0 },
            });
            expect(result.url).toBe('https://cdn/new.png');
        });

        it('defaults label to null when not provided', async () => {
            prismaMock.banner.create.mockResolvedValueOnce(makeBanner());
            await service.uploadBanner({ originalname: 'a.png' });
            const call = prismaMock.banner.create.mock.calls[0]![0] as any;
            expect(call.data.label).toBeNull();
        });
    });

    describe('deleteBanner()', () => {
        it('deletes storage files and the database record', async () => {
            prismaMock.banner.findUniqueOrThrow.mockResolvedValueOnce(makeBanner({ key: 'banners/a.png' }));
            await service.deleteBanner('b-1');
            expect(storageMock.deleteFiles).toHaveBeenCalledWith(['banners/a.png']);
            expect(prismaMock.banner.delete).toHaveBeenCalledWith({ where: { id: 'b-1' } });
        });

        it('still deletes the database record when storage deletion fails', async () => {
            prismaMock.banner.findUniqueOrThrow.mockResolvedValueOnce(makeBanner());
            storageMock.deleteFiles.mockRejectedValueOnce(new Error('s3 down'));
            await expect(service.deleteBanner('b-1')).resolves.toBeUndefined();
            expect(prismaMock.banner.delete).toHaveBeenCalled();
        });
    });

    describe('getGradePreview()', () => {
        it('returns null url for a grade with no banners in the pool', async () => {
            prismaMock.gradeBanner.findMany.mockResolvedValueOnce([{ grade: 'A', key: 'a.png' }]);
            const result = await service.getGradePreview();
            const newGrade = result.find((r) => r.grade === 'NEW');
            expect(newGrade).toEqual({ grade: 'NEW', url: null });
        });

        it('returns a resolved url for a grade with banners available', async () => {
            prismaMock.gradeBanner.findMany.mockResolvedValueOnce([{ grade: 'A', key: 'a.png' }]);
            const result = await service.getGradePreview();
            const gradeA = result.find((r) => r.grade === 'A');
            expect(gradeA?.url).toBe('https://cdn/a.png');
        });
    });

    describe('serializeSlide() via getPromoSlides()', () => {
        it('splits, trims, and filters the comma-separated specs string', async () => {
            prismaMock.promoSlide.findMany.mockResolvedValueOnce([makeSlide({ specs: 'spec1, spec2 ,spec3' })]);
            const slides = await service.getPromoSlides();
            expect(slides[0]!.specs).toEqual(['spec1', 'spec2', 'spec3']);
        });

        it('returns an empty specs array when specs is empty/falsy', async () => {
            prismaMock.promoSlide.findMany.mockResolvedValueOnce([makeSlide({ specs: '' })]);
            const slides = await service.getPromoSlides();
            expect(slides[0]!.specs).toEqual([]);
        });
    });

    describe('createPromoSlide()', () => {
        it('joins the specs array and applies field defaults', async () => {
            prismaMock.promoSlide.create.mockImplementationOnce(async (args: any) => ({ id: 'new', ...args.data }));

            const result = await service.createPromoSlide({
                tabTitle: 'T', tag: 'Tag', titleLine1: 'L1', titleLine2: 'L2', titleItalic: 'I',
                title: 'Title', subtitle: 'Sub', themeColor: '#fff', bgGlow: '#000',
                btnText: 'Go', btnLink: '/go', specs: ['a', 'b'],
            });

            const createCall = prismaMock.promoSlide.create.mock.calls[0]![0] as any;
            expect(createCall.data.specs).toBe('a,b');
            expect(createCall.data.badgeA).toBe('');
            expect(createCall.data.badgeB).toBe('');
            expect(createCall.data.layoutTheme).toBe('system');
            expect(createCall.data.imgKey).toBeNull();
            expect(result.specs).toEqual(['a', 'b']);
        });
    });

    describe('updatePromoSlide()', () => {
        it('joins specs when provided and remaps imageUrl to imgKey', async () => {
            prismaMock.promoSlide.update.mockImplementationOnce(async (args: any) => ({ ...makeSlide(), ...args.data }));

            await service.updatePromoSlide('s-1', { specs: ['x', 'y'], imageUrl: 'banners/promo/new.png' });

            const updateCall = prismaMock.promoSlide.update.mock.calls[0]![0] as any;
            expect(updateCall.data.specs).toBe('x,y');
            expect(updateCall.data.imgKey).toBe('banners/promo/new.png');
            expect(updateCall.data.imageUrl).toBeUndefined();
        });

        it('leaves specs/imgKey untouched when not provided', async () => {
            prismaMock.promoSlide.update.mockImplementationOnce(async (args: any) => ({ ...makeSlide(), ...args.data }));

            await service.updatePromoSlide('s-1', { title: 'New title' });

            const updateCall = prismaMock.promoSlide.update.mock.calls[0]![0] as any;
            expect(updateCall.data.specs).toBeUndefined();
            expect(updateCall.data.imgKey).toBeUndefined();
        });
    });

    describe('deletePromoSlide()', () => {
        it('deletes the storage file when imgKey is a raw storage key', async () => {
            prismaMock.promoSlide.findUniqueOrThrow.mockResolvedValueOnce(makeSlide({ imgKey: 'banners/promo/a.png' }));
            await service.deletePromoSlide('s-1');
            expect(storageMock.deleteFiles).toHaveBeenCalledWith(['banners/promo/a.png']);
            expect(prismaMock.promoSlide.delete).toHaveBeenCalledWith({ where: { id: 's-1' } });
        });

        it('does not attempt storage deletion when imgKey is an external http(s) url', async () => {
            prismaMock.promoSlide.findUniqueOrThrow.mockResolvedValueOnce(makeSlide({ imgKey: 'https://external.com/a.png' }));
            await service.deletePromoSlide('s-1');
            expect(storageMock.deleteFiles).not.toHaveBeenCalled();
            expect(prismaMock.promoSlide.delete).toHaveBeenCalledWith({ where: { id: 's-1' } });
        });
    });

    describe('togglePromoSlide()', () => {
        it('flips isActive and returns the serialized slide', async () => {
            prismaMock.promoSlide.findUniqueOrThrow.mockResolvedValueOnce(makeSlide({ isActive: true }));
            prismaMock.promoSlide.update.mockResolvedValueOnce(makeSlide({ isActive: false }));

            const result = await service.togglePromoSlide('s-1');

            expect(prismaMock.promoSlide.update).toHaveBeenCalledWith({ where: { id: 's-1' }, data: { isActive: false } });
            expect(result.isActive).toBe(false);
        });
    });

    describe('reorderPromoSlides()', () => {
        it('updates the order field for every item', async () => {
            await service.reorderPromoSlides([{ id: 's-1', order: 1 }, { id: 's-2', order: 2 }]);
            expect(prismaMock.promoSlide.update).toHaveBeenCalledWith({ where: { id: 's-1' }, data: { order: 1 } });
            expect(prismaMock.promoSlide.update).toHaveBeenCalledWith({ where: { id: 's-2' }, data: { order: 2 } });
        });
    });
});

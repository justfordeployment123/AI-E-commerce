import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { SeedService } from './seed.service';
import { PrismaService } from '../database/prisma.service';

jest.mock('fs');
jest.mock('@aws-sdk/client-s3', () => {
    return {
        S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
        PutObjectCommand: jest.fn((input: any) => ({ __type: 'Put', input })),
        DeleteObjectsCommand: jest.fn((input: any) => ({ __type: 'Delete', input })),
        ListObjectsV2Command: jest.fn((input: any) => ({ __type: 'List', input })),
        HeadObjectCommand: jest.fn((input: any) => ({ __type: 'Head', input })),
    };
});

const fsMock = fs as jest.Mocked<typeof fs>;

function makePrismaMock() {
    const deleteMany = () => jest.fn<() => Promise<any>>().mockResolvedValue({ count: 0 });
    return {
        orderItem: { deleteMany: deleteMany() },
        order: { deleteMany: deleteMany() },
        tradeIn: { deleteMany: deleteMany() },
        repair: { deleteMany: deleteMany() },
        review: { deleteMany: deleteMany() },
        scraperRun: { deleteMany: deleteMany() },
        scrapedPrice: { deleteMany: deleteMany() },
        product: {
            deleteMany: deleteMany(),
            findUnique: jest.fn<() => Promise<any>>(),
            create: jest.fn<() => Promise<any>>(),
            update: jest.fn<() => Promise<any>>(),
        },
        otherBrand: { deleteMany: deleteMany(), findFirst: jest.fn<() => Promise<any>>(), create: jest.fn<() => Promise<any>>() },
        otherSubcategory: { deleteMany: deleteMany(), findFirst: jest.fn<() => Promise<any>>(), create: jest.fn<() => Promise<any>>() },
        deviceCatalog: { deleteMany: deleteMany(), findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]), upsert: jest.fn<() => Promise<any>>(), create: jest.fn<() => Promise<any>>() },
        brandCategory: { deleteMany: deleteMany(), count: jest.fn<() => Promise<number>>().mockResolvedValue(0), upsert: jest.fn<() => Promise<any>>() },
        category: { deleteMany: deleteMany(), count: jest.fn<() => Promise<number>>().mockResolvedValue(0), upsert: jest.fn<() => Promise<any>>() },
        brand: { deleteMany: deleteMany(), count: jest.fn<() => Promise<number>>().mockResolvedValue(0), upsert: jest.fn<() => Promise<any>>() },
        banner: { deleteMany: deleteMany(), findUnique: jest.fn<() => Promise<any>>(), create: jest.fn<() => Promise<any>>() },
        promoSlide: { deleteMany: deleteMany(), findFirst: jest.fn<() => Promise<any>>(), create: jest.fn<() => Promise<any>>(), update: jest.fn<() => Promise<any>>() },
        pricingConfig: { deleteMany: deleteMany(), upsert: jest.fn<() => Promise<any>>() },
        gradeBanner: { findUnique: jest.fn<() => Promise<any>>(), create: jest.fn<(...args: any[]) => Promise<any>>() },
    };
}

describe('SeedService', () => {
    let service: SeedService;
    let prismaMock: ReturnType<typeof makePrismaMock>;
    let s3SendMock: jest.Mock<any>;

    beforeEach(async () => {
        jest.clearAllMocks();
        prismaMock = makePrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SeedService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<SeedService>(SeedService);
        s3SendMock = (service as any).s3Client.send as jest.Mock<any>;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('runSeed', () => {
        it('throws when products.json is missing', async () => {
            fsMock.existsSync.mockReturnValue(false);
            await expect(service.runSeed()).rejects.toThrow('products.json not found');
        });
    });

    describe('uploadLocalFile (private helper)', () => {
        it('returns null without calling S3 when the local file does not exist', async () => {
            fsMock.existsSync.mockReturnValue(false);
            const result = await (service as any).uploadLocalFile('/tmp/missing.png', 'key/missing.png');
            expect(result).toBeNull();
            expect(s3SendMock).not.toHaveBeenCalled();
        });

        it('returns the key when upload succeeds and HeadObject confirms it exists', async () => {
            fsMock.existsSync.mockReturnValue(true);
            fsMock.readFileSync.mockReturnValue(Buffer.from('data'));
            s3SendMock.mockResolvedValueOnce(undefined); // PutObjectCommand
            s3SendMock.mockResolvedValueOnce({}); // HeadObjectCommand
            const result = await (service as any).uploadLocalFile('/tmp/a.png', 'key/a.png');
            expect(result).toBe('key/a.png');
            expect(s3SendMock).toHaveBeenCalledTimes(2);
        });

        it('returns null when the object cannot be verified after upload (orphan detection)', async () => {
            fsMock.existsSync.mockReturnValue(true);
            fsMock.readFileSync.mockReturnValue(Buffer.from('data'));
            s3SendMock.mockResolvedValueOnce(undefined); // PutObjectCommand succeeds
            s3SendMock.mockRejectedValueOnce(new Error('not found')); // HeadObjectCommand fails
            const result = await (service as any).uploadLocalFile('/tmp/a.png', 'key/a.png');
            expect(result).toBeNull();
        });
    });

    describe('purgeAll', () => {
        it('deletes S3 objects in a single page and returns per-table counts', async () => {
            s3SendMock.mockResolvedValueOnce({ Contents: [{ Key: 'a' }, { Key: 'b' }], IsTruncated: false });
            s3SendMock.mockResolvedValueOnce({ Errors: [] }); // DeleteObjectsCommand
            prismaMock.product.deleteMany.mockResolvedValueOnce({ count: 5 });

            const result = await service.purgeAll();

            expect(result.deleted).toBe(2);
            expect(result.counts.products).toBe(5);
            expect(prismaMock.orderItem.deleteMany).toHaveBeenCalled();
            expect(prismaMock.pricingConfig.deleteMany).toHaveBeenCalled();
        });

        it('paginates through multiple S3 list pages using the continuation token', async () => {
            s3SendMock.mockResolvedValueOnce({ Contents: [{ Key: 'a' }], IsTruncated: true, NextContinuationToken: 'tok-1' });
            s3SendMock.mockResolvedValueOnce({ Errors: [] }); // delete page 1
            s3SendMock.mockResolvedValueOnce({ Contents: [{ Key: 'b' }, { Key: 'c' }], IsTruncated: false });
            s3SendMock.mockResolvedValueOnce({ Errors: [] }); // delete page 2

            const result = await service.purgeAll();

            expect(result.deleted).toBe(3);
            expect(s3SendMock).toHaveBeenCalledTimes(4);
        });

        it('handles an empty bucket without attempting a delete call', async () => {
            s3SendMock.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
            const result = await service.purgeAll();
            expect(result.deleted).toBe(0);
            expect(s3SendMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('seedGradeBanners (private helper)', () => {
        function setupGradeDir(files: string[]) {
            fsMock.existsSync.mockImplementation((p: any) => String(p).includes('Grade'));
            fsMock.readdirSync.mockReturnValue(files as any);
            fsMock.statSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
            fsMock.readFileSync.mockReturnValue(Buffer.from('img'));
        }

        it('skips files whose grade prefix is not a recognised grade', async () => {
            setupGradeDir(['weird_1.png']);
            const count = await (service as any).seedGradeBanners();
            expect(count).toBe(0);
            expect(prismaMock.gradeBanner.create).not.toHaveBeenCalled();
        });

        it('creates a grade banner for a new, valid grade file', async () => {
            setupGradeDir(['a_1.png']);
            prismaMock.gradeBanner.findUnique.mockResolvedValueOnce(null);
            s3SendMock.mockResolvedValueOnce(undefined); // Put
            s3SendMock.mockResolvedValueOnce({}); // Head (verify upload)
            const count = await (service as any).seedGradeBanners();
            expect(count).toBe(1);
            expect(prismaMock.gradeBanner.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ grade: 'A' }),
            }));
        });

        it('maps the "new" prefix to grade NEW', async () => {
            setupGradeDir(['new_2.png']);
            prismaMock.gradeBanner.findUnique.mockResolvedValueOnce(null);
            s3SendMock.mockResolvedValueOnce(undefined);
            s3SendMock.mockResolvedValueOnce({});
            await (service as any).seedGradeBanners();
            expect(prismaMock.gradeBanner.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ grade: 'NEW' }),
            }));
        });

        it('skips re-uploading when an existing row is verified present in storage', async () => {
            setupGradeDir(['a_1.png']);
            prismaMock.gradeBanner.findUnique.mockResolvedValueOnce({ id: 'gb1', key: 'banners/grade/a/a_1.png' });
            s3SendMock.mockResolvedValueOnce({}); // HeadObjectCommand succeeds -> verified, continue
            const count = await (service as any).seedGradeBanners();
            expect(count).toBe(0);
            expect(prismaMock.gradeBanner.create).not.toHaveBeenCalled();
            // Only the verification HeadObject call should have happened, no re-upload Put/Head pair
            expect(s3SendMock).toHaveBeenCalledTimes(1);
        });

        it('re-uploads when the DB row exists but the object is missing from storage', async () => {
            setupGradeDir(['a_1.png']);
            prismaMock.gradeBanner.findUnique.mockResolvedValueOnce({ id: 'gb1', key: 'banners/grade/a/a_1.png' });
            s3SendMock.mockRejectedValueOnce(new Error('missing')); // HeadObjectCommand verify fails
            s3SendMock.mockResolvedValueOnce(undefined); // re-upload Put
            s3SendMock.mockResolvedValueOnce({}); // re-upload Head verify
            const count = await (service as any).seedGradeBanners();
            expect(count).toBe(1);
            // existing row -> should not create a duplicate DB row
            expect(prismaMock.gradeBanner.create).not.toHaveBeenCalled();
        });
    });
});

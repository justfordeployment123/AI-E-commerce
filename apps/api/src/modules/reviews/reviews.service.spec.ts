import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';

function makeReview(overrides: Partial<any> = {}) {
    return {
        id: 'review-1',
        productId: 'prod-1',
        userId: 'user-1',
        guestName: null,
        rating: 4,
        body: 'Great product',
        images: ['r1.jpg'],
        isApproved: false,
        product: { name: 'iPhone 13', slug: 'iphone-13', images: ['p1.jpg'] },
        ...overrides,
    };
}

describe('ReviewsService', () => {
    let service: ReviewsService;
    let prismaMock: any;
    let storageMock: any;

    beforeEach(async () => {
        prismaMock = {
            review: {
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                findUnique: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                delete: jest.fn<() => Promise<any>>(),
                aggregate: jest.fn<() => Promise<any>>().mockResolvedValue({ _avg: { rating: null }, _count: { id: 0 } }),
            },
            product: {
                findUnique: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
            },
        };
        storageMock = {
            resolveImageUrl: jest.fn<(k: string) => Promise<string>>().mockImplementation((k: any) => Promise.resolve(`https://cdn/${k}`)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: StorageService, useValue: storageMock },
            ],
        }).compile();

        service = module.get<ReviewsService>(ReviewsService);
    });

    describe('getRecentReviews', () => {
        it('resolves review and product cover images', async () => {
            prismaMock.review.findMany.mockResolvedValueOnce([makeReview()]);
            const result = await service.getRecentReviews();
            expect(result[0].images).toEqual(['https://cdn/r1.jpg']);
            expect(result[0].product.coverImage).toBe('https://cdn/p1.jpg');
        });

        it('sets coverImage to null when product has no images', async () => {
            prismaMock.review.findMany.mockResolvedValueOnce([makeReview({ product: { name: 'x', slug: 'x', images: [] } })]);
            const result = await service.getRecentReviews();
            expect(result[0].product.coverImage).toBeNull();
        });

        it('filters out unresolved (falsy) image urls', async () => {
            prismaMock.review.findMany.mockResolvedValueOnce([makeReview({ images: ['a.jpg', 'b.jpg'] })]);
            storageMock.resolveImageUrl
                .mockResolvedValueOnce('https://cdn/a.jpg')
                .mockResolvedValueOnce(null);
            const result = await service.getRecentReviews();
            expect(result[0].images).toEqual(['https://cdn/a.jpg']);
        });
    });

    describe('getProductReviews', () => {
        it('queries only approved reviews for the given product', async () => {
            await service.getProductReviews('prod-1');
            const where = prismaMock.review.findMany.mock.calls[0][0].where;
            expect(where).toEqual({ productId: 'prod-1', isApproved: true });
        });
    });

    describe('createReview', () => {
        it('throws NotFoundException when product does not exist', async () => {
            prismaMock.product.findUnique.mockResolvedValueOnce(null);
            await expect(service.createReview('missing', { rating: 5, body: 'nice' })).rejects.toThrow(NotFoundException);
        });

        it('clamps rating above 5 down to 5', async () => {
            prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'prod-1' });
            await service.createReview('prod-1', { rating: 10, body: 'nice' });
            const data = prismaMock.review.create.mock.calls[0][0].data;
            expect(data.rating).toBe(5);
        });

        it('clamps rating below 1 up to 1', async () => {
            prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'prod-1' });
            await service.createReview('prod-1', { rating: -3, body: 'meh' });
            const data = prismaMock.review.create.mock.calls[0][0].data;
            expect(data.rating).toBe(1);
        });

        it('defaults userId/guestName/images when omitted', async () => {
            prismaMock.product.findUnique.mockResolvedValueOnce({ id: 'prod-1' });
            await service.createReview('prod-1', { rating: 3, body: 'ok' });
            const data = prismaMock.review.create.mock.calls[0][0].data;
            expect(data.userId).toBeNull();
            expect(data.guestName).toBeNull();
            expect(data.images).toEqual([]);
        });
    });

    describe('getAllReviews', () => {
        it('filters to pending (isApproved: false) when filter="pending"', async () => {
            await service.getAllReviews('pending');
            expect(prismaMock.review.findMany.mock.calls[0][0].where).toEqual({ isApproved: false });
        });

        it('filters to approved (isApproved: true) when filter="approved"', async () => {
            await service.getAllReviews('approved');
            expect(prismaMock.review.findMany.mock.calls[0][0].where).toEqual({ isApproved: true });
        });

        it('applies no filter when omitted', async () => {
            await service.getAllReviews();
            expect(prismaMock.review.findMany.mock.calls[0][0].where).toEqual({});
        });
    });

    describe('approveReview', () => {
        it('throws NotFoundException when review does not exist', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(null);
            await expect(service.approveReview('missing')).rejects.toThrow(NotFoundException);
        });

        it('approves the review and recalculates product rating', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview({ isApproved: false }));
            prismaMock.review.update.mockResolvedValueOnce(makeReview({ isApproved: true }));
            prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.567 }, _count: { id: 3 } });
            const result = await service.approveReview('review-1');
            expect(result.isApproved).toBe(true);
            expect(prismaMock.product.update).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
                data: { rating: 4.6, reviewCount: 3 },
            });
        });

        it('rounds average rating to one decimal place', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview());
            prismaMock.review.update.mockResolvedValueOnce(makeReview({ isApproved: true }));
            prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 3.333333 }, _count: { id: 5 } });
            await service.approveReview('review-1');
            const data = prismaMock.product.update.mock.calls[0][0].data;
            expect(data.rating).toBe(3.3);
        });

        it('defaults rating to 0 when there are no approved reviews left', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview());
            prismaMock.review.update.mockResolvedValueOnce(makeReview({ isApproved: true }));
            prismaMock.review.aggregate.mockResolvedValueOnce({ _avg: { rating: null }, _count: { id: 0 } });
            await service.approveReview('review-1');
            const data = prismaMock.product.update.mock.calls[0][0].data;
            expect(data.rating).toBe(0);
        });
    });

    describe('hideReview', () => {
        it('throws NotFoundException when review does not exist', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(null);
            await expect(service.hideReview('missing')).rejects.toThrow(NotFoundException);
        });

        it('hides the review and recalculates product rating', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview({ isApproved: true }));
            prismaMock.review.update.mockResolvedValueOnce(makeReview({ isApproved: false }));
            const result = await service.hideReview('review-1');
            expect(result.isApproved).toBe(false);
            expect(prismaMock.review.aggregate).toHaveBeenCalled();
            expect(prismaMock.product.update).toHaveBeenCalled();
        });
    });

    describe('deleteReview', () => {
        it('throws NotFoundException when review does not exist', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(null);
            await expect(service.deleteReview('missing')).rejects.toThrow(NotFoundException);
        });

        it('deletes an approved review and recalculates rating', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview({ isApproved: true }));
            await service.deleteReview('review-1');
            expect(prismaMock.review.delete).toHaveBeenCalledWith({ where: { id: 'review-1' } });
            expect(prismaMock.product.update).toHaveBeenCalled();
        });

        it('deletes a non-approved review without recalculating rating', async () => {
            prismaMock.review.findUnique.mockResolvedValueOnce(makeReview({ isApproved: false }));
            await service.deleteReview('review-1');
            expect(prismaMock.review.delete).toHaveBeenCalled();
            expect(prismaMock.product.update).not.toHaveBeenCalled();
        });
    });
});

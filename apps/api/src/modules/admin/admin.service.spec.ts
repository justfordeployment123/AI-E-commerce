import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';

function makePrismaMock() {
    return {
        order: {
            count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            aggregate: jest.fn<() => Promise<any>>().mockResolvedValue({ _sum: { total: 0 } }),
            findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
            groupBy: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        },
        tradeIn: {
            count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            groupBy: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        },
        repair: {
            count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            groupBy: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        },
        user: {
            count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            findMany: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue([]),
        },
        orderItem: {
            groupBy: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        },
        product: {
            findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
        },
        $queryRaw: jest.fn<() => Promise<any>>().mockResolvedValue([]),
    };
}

describe('AdminService', () => {
    let service: AdminService;
    let prismaMock: ReturnType<typeof makePrismaMock>;

    beforeEach(async () => {
        prismaMock = makePrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [AdminService, { provide: PrismaService, useValue: prismaMock }],
        }).compile();

        service = module.get<AdminService>(AdminService);
    });

    describe('getDashboard()', () => {
        it('coalesces null revenue sums to 0 and maps groupBy breakdowns', async () => {
            prismaMock.order.aggregate
                .mockResolvedValueOnce({ _sum: { total: null } }) // totalRevenue
                .mockResolvedValueOnce({ _sum: { total: null } }); // revenueThisMonth
            prismaMock.order.groupBy.mockResolvedValueOnce([
                { status: 'PENDING', _count: { id: 3 } },
                { status: 'CONFIRMED', _count: { id: 5 } },
            ]);
            prismaMock.tradeIn.groupBy.mockResolvedValueOnce([{ status: 'SUBMITTED', _count: { id: 2 } }]);
            prismaMock.repair.groupBy.mockResolvedValueOnce([{ status: 'SUBMITTED', _count: { id: 1 } }]);

            const result = await service.getDashboard();

            expect(result.stats.orders.revenue).toBe(0);
            expect(result.stats.orders.revenueThisMonth).toBe(0);
            expect(result.breakdown.orders).toEqual([
                { status: 'PENDING', count: 3 },
                { status: 'CONFIRMED', count: 5 },
            ]);
            expect(result.breakdown.tradeIns).toEqual([{ status: 'SUBMITTED', count: 2 }]);
            expect(result.breakdown.repairs).toEqual([{ status: 'SUBMITTED', count: 1 }]);
        });

        it('returns actual revenue sums when present', async () => {
            prismaMock.order.aggregate
                .mockResolvedValueOnce({ _sum: { total: 1500 } })
                .mockResolvedValueOnce({ _sum: { total: 300 } });
            prismaMock.order.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
            prismaMock.user.count.mockResolvedValueOnce(50).mockResolvedValueOnce(4);

            const result = await service.getDashboard();

            expect(result.stats.orders.revenue).toBe(1500);
            expect(result.stats.orders.revenueThisMonth).toBe(300);
            expect(result.stats.orders.total).toBe(10);
            expect(result.stats.orders.pending).toBe(2);
            expect(result.stats.users.total).toBe(50);
            expect(result.stats.users.newThisMonth).toBe(4);
        });
    });

    describe('getAnalytics()', () => {
        it('computes summary totals and avgOrderValue across 6 months', async () => {
            prismaMock.order.count.mockResolvedValue(2); // called once per month (x6) => 12
            prismaMock.tradeIn.count.mockResolvedValue(1); // x6 => 6
            prismaMock.repair.count.mockResolvedValue(0);
            prismaMock.order.aggregate.mockResolvedValue({ _sum: { total: 100 } }); // x6 => 600

            const result = await service.getAnalytics();

            expect(result.summary.totalOrders).toBe(12);
            expect(result.summary.totalTradeIns).toBe(6);
            expect(result.summary.totalRevenue).toBe(600);
            expect(result.summary.avgOrderValue).toBe(50); // round(600/12)
            expect(result.monthly).toHaveLength(6);
            expect(result.monthly[0]).toMatchObject({ orders: 2, tradeIns: 1, repairs: 0, revenue: 100 });
        });

        it('avgOrderValue is 0 when there are no orders', async () => {
            prismaMock.order.count.mockResolvedValue(0);
            prismaMock.order.aggregate.mockResolvedValue({ _sum: { total: null } });

            const result = await service.getAnalytics();

            expect(result.summary.totalOrders).toBe(0);
            expect(result.summary.avgOrderValue).toBe(0);
        });

        it('falls back to "Unknown"/"—" for top products missing from the product lookup', async () => {
            prismaMock.orderItem.groupBy.mockResolvedValueOnce([
                { productId: 'p-missing', _sum: { quantity: 5, price: 200 } },
                { productId: 'p-found', _sum: { quantity: 3, price: 90 } },
            ]);
            prismaMock.product.findMany.mockResolvedValueOnce([
                {
                    id: 'p-found',
                    name: 'Widget',
                    catalog: { brandCategory: { category: { name: 'Phones' } } },
                },
            ]);

            const result = await service.getAnalytics();

            expect(result.topProducts).toEqual([
                { productId: 'p-missing', name: 'Unknown', category: '—', units: 5, revenue: 200 },
                { productId: 'p-found', name: 'Widget', category: 'Phones', units: 3, revenue: 90 },
            ]);
        });

        it('returns empty categorySplit when the raw query total is 0', async () => {
            prismaMock.$queryRaw.mockResolvedValueOnce([]);
            const result = await service.getAnalytics();
            expect(result.categorySplit).toEqual([]);
        });

        it('computes rounded percentages for categorySplit when totals exist', async () => {
            prismaMock.$queryRaw.mockResolvedValueOnce([
                { category: 'Phones', total: 3n },
                { category: 'Laptops', total: 1n },
            ]);
            const result = await service.getAnalytics();
            expect(result.categorySplit).toEqual([
                { category: 'Phones', pct: 75 },
                { category: 'Laptops', pct: 25 },
            ]);
        });

        it('maps top traded devices with rounded average offer', async () => {
            prismaMock.tradeIn.groupBy.mockResolvedValueOnce([
                { brand: 'Apple', model: 'iPhone 13', _count: { id: 4 }, _avg: { offerPrice: 199.6 } },
            ]);
            const result = await service.getAnalytics();
            expect(result.topTradeIns).toEqual([{ device: 'Apple iPhone 13', count: 4, avgOffer: 200 }]);
        });
    });

    describe('getUsers()', () => {
        it('applies default pagination when no query params are given', async () => {
            prismaMock.user.findMany.mockResolvedValueOnce([]);
            prismaMock.user.count.mockResolvedValueOnce(0);

            const result = await service.getUsers({});

            expect(prismaMock.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {}, skip: 0, take: 20 }),
            );
            expect(result).toEqual({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
        });

        it('builds a case-insensitive OR search filter on name/email', async () => {
            await service.getUsers({ search: 'john' });

            const callArgs = prismaMock.user.findMany.mock.calls[0]![0] as any;
            expect(callArgs.where).toEqual({
                OR: [
                    { name: { contains: 'john', mode: 'insensitive' } },
                    { email: { contains: 'john', mode: 'insensitive' } },
                ],
            });
        });

        it('caps limit at 100 even when a larger limit is requested', async () => {
            await service.getUsers({ limit: 500 });

            const callArgs = prismaMock.user.findMany.mock.calls[0]![0] as any;
            expect(callArgs.take).toBe(100);
        });

        it('computes skip and total pages from page/limit/total', async () => {
            prismaMock.user.count.mockResolvedValueOnce(45);

            const result = await service.getUsers({ page: 2, limit: 20 });

            const callArgs = prismaMock.user.findMany.mock.calls[0]![0] as any;
            expect(callArgs.skip).toBe(20);
            expect(result.pages).toBe(3); // Math.ceil(45/20)
        });
    });
});

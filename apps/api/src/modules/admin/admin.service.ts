import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboard() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            totalOrders,
            pendingOrders,
            totalRevenue,
            revenueThisMonth,
            totalTradeIns,
            pendingTradeIns,
            totalRepairs,
            pendingRepairs,
            totalUsers,
            newUsersThisMonth,
            recentOrders,
            ordersByStatus,
            tradeInsByStatus,
            repairsByStatus,
        ] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.order.aggregate({ _sum: { total: true } }),
            this.prisma.order.aggregate({
                where: { createdAt: { gte: thirtyDaysAgo } },
                _sum: { total: true },
            }),
            this.prisma.tradeIn.count(),
            this.prisma.tradeIn.count({ where: { status: 'SUBMITTED' } }),
            this.prisma.repair.count(),
            this.prisma.repair.count({ where: { status: 'SUBMITTED' } }),
            this.prisma.user.count(),
            this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            this.prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    items: { include: { product: { select: { id: true, name: true } } } },
                },
            }),
            this.prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
            this.prisma.tradeIn.groupBy({ by: ['status'], _count: { id: true } }),
            this.prisma.repair.groupBy({ by: ['status'], _count: { id: true } }),
        ]);

        return {
            stats: {
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    revenue: totalRevenue._sum.total ?? 0,
                    revenueThisMonth: revenueThisMonth._sum.total ?? 0,
                },
                tradeIns: {
                    total: totalTradeIns,
                    pending: pendingTradeIns,
                },
                repairs: {
                    total: totalRepairs,
                    pending: pendingRepairs,
                },
                users: {
                    total: totalUsers,
                    newThisMonth: newUsersThisMonth,
                },
            },
            recentOrders,
            breakdown: {
                orders: ordersByStatus.map((s) => ({ status: s.status, count: s._count.id })),
                tradeIns: tradeInsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
                repairs: repairsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
            },
        };
    }

    async getAnalytics() {
        // Last 6 calendar months
        const months: { year: number; month: number; label: string; start: Date; end: Date }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                label: d.toLocaleString('en-GB', { month: 'short' }),
                start,
                end,
            });
        }

        const [monthlyData, topProducts, categorySplit, recentTradeIns] = await Promise.all([
            // Monthly orders, trade-ins, repairs, revenue
            Promise.all(
                months.map(async (m) => {
                    const [orders, tradeIns, repairs, revenue] = await Promise.all([
                        this.prisma.order.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
                        this.prisma.tradeIn.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
                        this.prisma.repair.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
                        this.prisma.order.aggregate({
                            where: { createdAt: { gte: m.start, lte: m.end }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
                            _sum: { total: true },
                        }),
                    ]);
                    return { month: m.label, year: m.year, orders, tradeIns, repairs, revenue: revenue._sum.total ?? 0 };
                }),
            ),
            // Top 5 products by units sold
            this.prisma.orderItem.groupBy({
                by: ['productId'],
                _sum: { quantity: true, price: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }).then(async (rows) => {
                const products = await this.prisma.product.findMany({
                    where: { id: { in: rows.map((r) => r.productId) } },
                    select: { id: true, name: true, category: true },
                });
                const byId = Object.fromEntries(products.map((p) => [p.id, p]));
                return rows.map((r) => ({
                    productId: r.productId,
                    name: byId[r.productId]?.name ?? 'Unknown',
                    category: byId[r.productId]?.category ?? '—',
                    units: r._sum.quantity ?? 0,
                    revenue: r._sum.price ?? 0,
                }));
            }),
            // Category split using a single aggregated query
            this.prisma.$queryRaw<{ category: string; total: bigint }[]>`
                SELECT p.category, SUM(oi.quantity)::bigint AS total
                FROM order_items oi
                JOIN products p ON oi."productId" = p.id
                GROUP BY p.category
                ORDER BY total DESC
            `.then((rows) => {
                const grand = rows.reduce((s, r) => s + Number(r.total), 0);
                if (grand === 0) return [];
                return rows.map((r) => ({
                    category: r.category,
                    pct: Math.round((Number(r.total) / grand) * 100),
                }));
            }),
            // Most traded devices (top 5 by count)
            this.prisma.tradeIn.groupBy({
                by: ['brand', 'model'],
                _count: { id: true },
                _avg: { offerPrice: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }).then((rows) =>
                rows.map((r) => ({
                    device: `${r.brand} ${r.model}`,
                    count: r._count.id,
                    avgOffer: Math.round(r._avg.offerPrice ?? 0),
                })),
            ),
        ]);

        const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
        const totalOrders = monthlyData.reduce((s, m) => s + m.orders, 0);
        const totalTradeIns = monthlyData.reduce((s, m) => s + m.tradeIns, 0);
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        return {
            summary: { totalRevenue, totalOrders, totalTradeIns, avgOrderValue },
            monthly: monthlyData,
            topProducts,
            categorySplit,
            topTradeIns: recentTradeIns,
        };
    }

    async getUsers(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 20, search } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        const where = search
            ? {
                  OR: [
                      { name: { contains: search, mode: 'insensitive' as const } },
                      { email: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: safeLimit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    _count: { select: { orders: true, tradeIns: true, repairs: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }
}

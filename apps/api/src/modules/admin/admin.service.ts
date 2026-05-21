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

    async getUsers(query: { page?: number; limit?: number; search?: string }) {
        const { page = 1, limit = 20, search } = query;
        const skip = (page - 1) * limit;

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
                take: limit,
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

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
}

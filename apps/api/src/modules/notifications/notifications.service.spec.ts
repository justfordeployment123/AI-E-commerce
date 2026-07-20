import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../database/prisma.service';
import { SseService } from './sse.service';

function makeNotification(overrides: Partial<any> = {}) {
    return {
        id: 'notif-1',
        userId: 'user-1',
        type: 'ORDER_UPDATE',
        title: 'Order shipped',
        body: 'Your order has shipped',
        data: {},
        read: false,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

describe('NotificationsService', () => {
    let service: NotificationsService;
    let prismaMock: any;
    let sseMock: any;

    beforeEach(async () => {
        prismaMock = {
            notification: {
                create: jest.fn<() => Promise<any>>(),
                findMany: jest.fn<() => Promise<any>>(),
                updateMany: jest.fn<() => Promise<any>>(),
            },
        };
        sseMock = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: SseService, useValue: sseMock },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    describe('create', () => {
        it('creates the notification and emits it over SSE to the user', async () => {
            const notification = makeNotification();
            prismaMock.notification.create.mockResolvedValueOnce(notification);

            const result = await service.create('user-1', 'ORDER_UPDATE', 'Order shipped', 'Your order has shipped');

            expect(prismaMock.notification.create).toHaveBeenCalledWith({
                data: { userId: 'user-1', type: 'ORDER_UPDATE', title: 'Order shipped', body: 'Your order has shipped', data: {} },
            });
            expect(sseMock.emit).toHaveBeenCalledWith('user-1', {
                id: notification.id,
                type: 'ORDER_UPDATE',
                title: 'Order shipped',
                body: 'Your order has shipped',
                data: {},
                read: false,
                createdAt: notification.createdAt,
            });
            expect(result).toEqual(notification);
        });

        it('passes through a custom data payload', async () => {
            const notification = makeNotification({ data: { orderId: 'order-1' } });
            prismaMock.notification.create.mockResolvedValueOnce(notification);

            await service.create('user-1', 'ORDER_UPDATE', 'Order shipped', 'body', { orderId: 'order-1' });

            expect(prismaMock.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ data: { orderId: 'order-1' } }),
            });
        });
    });

    describe('findByUser', () => {
        it('returns the most recent 50 notifications for the user', async () => {
            const list = [makeNotification()];
            prismaMock.notification.findMany.mockResolvedValueOnce(list);

            const result = await service.findByUser('user-1');

            expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            expect(result).toEqual(list);
        });
    });

    describe('markRead', () => {
        it('scopes the update to the given notification id and user', async () => {
            prismaMock.notification.updateMany.mockResolvedValueOnce({ count: 1 });
            const result = await service.markRead('notif-1', 'user-1');

            expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
                where: { id: 'notif-1', userId: 'user-1' },
                data: { read: true },
            });
            expect(result).toEqual({ count: 1 });
        });
    });

    describe('markAllRead', () => {
        it('marks all unread notifications for the user as read', async () => {
            prismaMock.notification.updateMany.mockResolvedValueOnce({ count: 3 });
            const result = await service.markAllRead('user-1');

            expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-1', read: false },
                data: { read: true },
            });
            expect(result).toEqual({ count: 3 });
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { PaymentsService } from '../payments/payments.service';

function makeProduct(overrides: Partial<any> = {}) {
    return {
        id: 'p1',
        name: 'Widget',
        isActive: true,
        stock: 10,
        price: 50,
        ...overrides,
    };
}

function makeOrder(overrides: Partial<any> = {}) {
    return {
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
        subtotal: 50,
        shipping: 5.99,
        discount: 0,
        total: 55.99,
        notes: null,
        items: [
            { productId: 'p1', quantity: 1, price: 50, product: { id: 'p1', name: 'Widget', slug: 'widget', images: [], condition: 'NEW' } },
        ],
        user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        ...overrides,
    };
}

describe('OrdersService', () => {
    let service: OrdersService;
    let prismaMock: any;
    let txMock: any;
    let emailMock: any;
    let paymentsMock: any;

    beforeEach(async () => {
        txMock = {
            product: { update: jest.fn<() => Promise<any>>() },
            order: {
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
            },
        };

        prismaMock = {
            product: {
                findMany: jest.fn<() => Promise<any>>(),
            },
            order: {
                findMany: jest.fn<() => Promise<any>>(),
                count: jest.fn<() => Promise<any>>(),
                findUnique: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                deleteMany: jest.fn<() => Promise<any>>(),
            },
            orderItem: {
                deleteMany: jest.fn<() => Promise<any>>(),
            },
            $transaction: jest.fn(async (cb: any) => cb(txMock)),
        };

        emailMock = {
            sendOrderConfirmation: jest.fn(),
        };

        paymentsMock = {
            verifyPayment: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
            isConfigured: jest.fn<() => Promise<any>>().mockResolvedValue(false),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: EmailService, useValue: emailMock },
                { provide: PaymentsService, useValue: paymentsMock },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    describe('create', () => {
        const baseDto = () => ({
            items: [{ productId: 'p1', quantity: 1 }],
            shippingAddress: { name: 'Alice', address: '1 St', city: 'City', postcode: '12345', country: 'US' },
            paymentMethod: 'dev',
        }) as any;

        it('throws BadRequestException when a product is missing or inactive', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([]);
            await expect(service.create(baseDto())).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when requested quantity exceeds stock', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ stock: 0 })]);
            await expect(service.create(baseDto())).rejects.toThrow(BadRequestException);
        });

        it('applies free shipping when subtotal is >= 100', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 150, stock: 10 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder({ subtotal: 150, shipping: 0, total: 150 }));

            await service.create(baseDto());

            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.shipping).toBe(0);
            expect(createArgs.data.subtotal).toBe(150);
        });

        it('charges 5.99 shipping when subtotal is below 100', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create(baseDto());

            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.shipping).toBe(5.99);
            expect(createArgs.data.total).toBeCloseTo(55.99);
        });

        it('applies a valid promo code discount to the total', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 150 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create({ ...baseDto(), promoCode: 'TECHSTOP10' });

            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.discount).toBe(15); // 10% of 150
            expect(createArgs.data.total).toBe(150 - 15 + 0); // free shipping since >= 100
        });

        it('ignores an invalid promo code (zero discount)', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create({ ...baseDto(), promoCode: 'NOT_REAL' });

            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.discount).toBe(0);
        });

        it('throws BadRequestException for stripe payment method without paymentIntentId', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct()]);
            await expect(service.create({ ...baseDto(), paymentMethod: 'stripe' })).rejects.toThrow(BadRequestException);
            expect(paymentsMock.verifyPayment).not.toHaveBeenCalled();
        });

        it('verifies payment server-side for stripe orders and sets status CONFIRMED', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder({ status: 'CONFIRMED' }));

            await service.create({ ...baseDto(), paymentMethod: 'stripe', paymentIntentId: 'pi_123' });

            expect(paymentsMock.verifyPayment).toHaveBeenCalledWith('pi_123', Math.round(55.99 * 100));
            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.status).toBe('CONFIRMED');
        });

        it('throws BadRequestException for dev payment method when Stripe is configured', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct()]);
            paymentsMock.isConfigured.mockResolvedValueOnce(true);
            await expect(service.create(baseDto())).rejects.toThrow(BadRequestException);
        });

        it('leaves status undefined (schema default) for dev payment method when Stripe is not configured', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create(baseDto());

            const createArgs = txMock.order.create.mock.calls[0][0];
            expect(createArgs.data.status).toBeUndefined();
        });

        it('decrements stock for each line item inside the transaction', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create(baseDto());

            expect(txMock.product.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: { stock: { decrement: 1 } },
            });
        });

        it('translates a P2002 conflict on paymentIntentId into BadRequestException', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            const err = new Prisma.PrismaClientKnownRequestError('duplicate', {
                code: 'P2002',
                clientVersion: '1.0',
                meta: { target: ['paymentIntentId'] },
            });
            prismaMock.$transaction.mockRejectedValueOnce(err);

            await expect(service.create(baseDto())).rejects.toThrow(BadRequestException);
        });

        it('rethrows a P2002 conflict unrelated to paymentIntentId', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            const err = new Prisma.PrismaClientKnownRequestError('duplicate', {
                code: 'P2002',
                clientVersion: '1.0',
                meta: { target: ['email'] },
            });
            prismaMock.$transaction.mockRejectedValueOnce(err);

            await expect(service.create(baseDto())).rejects.toBe(err);
        });

        it('rethrows non-Prisma errors from the transaction unchanged', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            const err = new Error('unexpected');
            prismaMock.$transaction.mockRejectedValueOnce(err);

            await expect(service.create(baseDto())).rejects.toBe(err);
        });

        it('sends an order confirmation email when the order has a user email', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder());

            await service.create(baseDto());

            expect(emailMock.sendOrderConfirmation).toHaveBeenCalledWith(
                expect.objectContaining({ to: 'alice@example.com', orderId: 'order-1' }),
            );
        });

        it('skips sending an email when the order has no user email', async () => {
            prismaMock.product.findMany.mockResolvedValueOnce([makeProduct({ price: 50 })]);
            txMock.order.create.mockResolvedValueOnce(makeOrder({ user: null }));

            await service.create(baseDto());

            expect(emailMock.sendOrderConfirmation).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('paginates and returns metadata', async () => {
            prismaMock.order.findMany.mockResolvedValueOnce([makeOrder()]);
            prismaMock.order.count.mockResolvedValueOnce(1);

            const result = await service.findAll({ page: 1, limit: 20 });

            expect(result).toEqual({ items: [makeOrder()], total: 1, page: 1, limit: 20, pages: 1 });
        });

        it('applies a status filter when provided', async () => {
            prismaMock.order.findMany.mockResolvedValueOnce([]);
            prismaMock.order.count.mockResolvedValueOnce(0);

            await service.findAll({ status: 'SHIPPED' });

            const call = prismaMock.order.findMany.mock.calls[0][0];
            expect(call.where.status).toBe('SHIPPED');
        });

        it('applies a search filter across id and user name', async () => {
            prismaMock.order.findMany.mockResolvedValueOnce([]);
            prismaMock.order.count.mockResolvedValueOnce(0);

            await service.findAll({ search: 'alice' });

            const call = prismaMock.order.findMany.mock.calls[0][0];
            expect(call.where.OR).toEqual([
                { id: { contains: 'alice', mode: 'insensitive' } },
                { user: { name: { contains: 'alice', mode: 'insensitive' } } },
            ]);
        });
    });

    describe('findById', () => {
        it('throws NotFoundException when order does not exist', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(null);
            await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the order when found', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder());
            const result = await service.findById('order-1');
            expect(result).toEqual(makeOrder());
        });
    });

    describe('findByIdForUser', () => {
        it('returns the order for its owner', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'user-1' }));
            const result = await service.findByIdForUser('order-1', { id: 'user-1', role: 'USER' });
            expect(result.id).toBe('order-1');
        });

        it('returns the order for an admin regardless of ownership', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'someone-else' }));
            const result = await service.findByIdForUser('order-1', { id: 'admin-1', role: 'ADMIN' });
            expect(result.id).toBe('order-1');
        });

        it('throws NotFoundException (not Forbidden) for a non-owner, non-admin user', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'someone-else' }));
            await expect(
                service.findByIdForUser('order-1', { id: 'user-1', role: 'USER' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByUser', () => {
        it('returns orders for the given user', async () => {
            prismaMock.order.findMany.mockResolvedValueOnce([makeOrder()]);
            const result = await service.findByUser('user-1');
            expect(prismaMock.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { createdAt: 'desc' },
                include: expect.anything(),
            });
            expect(result).toEqual([makeOrder()]);
        });
    });

    describe('update', () => {
        it('throws NotFoundException when order does not exist', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(null);
            await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
        });

        it('updates the order when it exists', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder());
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ notes: 'updated' }));
            const result = await service.update('order-1', { notes: 'updated' } as any);
            expect(result.notes).toBe('updated');
        });
    });

    describe('confirm', () => {
        it('throws BadRequestException when order is not PENDING', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'CONFIRMED' }));
            await expect(service.confirm('order-1')).rejects.toThrow(BadRequestException);
        });

        it('confirms a PENDING order', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'PENDING' }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'CONFIRMED' }));
            const result = await service.confirm('order-1');
            expect(prismaMock.order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: 'CONFIRMED' } });
            expect(result.status).toBe('CONFIRMED');
        });
    });

    describe('ship', () => {
        it.each(['PENDING', 'CONFIRMED', 'PROCESSING'])('ships an order in %s status', async (status) => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'SHIPPED' }));
            const result = await service.ship('order-1', { trackingNumber: 'TRACK123' } as any);
            expect(result.status).toBe('SHIPPED');
        });

        it('throws BadRequestException for a status that cannot be shipped', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'DELIVERED' }));
            await expect(service.ship('order-1', {} as any)).rejects.toThrow(BadRequestException);
        });

        it('falls back to the existing notes when dto.notes is not provided', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'PENDING', notes: 'original notes' }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'SHIPPED' }));

            await service.ship('order-1', { trackingNumber: 'TRACK123' } as any);

            const call = prismaMock.order.update.mock.calls[0][0];
            expect(call.data.notes).toBe('original notes');
        });

        it('uses dto.notes when explicitly provided', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'PENDING', notes: 'original notes' }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'SHIPPED' }));

            await service.ship('order-1', { trackingNumber: 'TRACK123', notes: 'new notes' } as any);

            const call = prismaMock.order.update.mock.calls[0][0];
            expect(call.data.notes).toBe('new notes');
        });
    });

    describe('deliver', () => {
        it('throws BadRequestException when order is not SHIPPED', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'CONFIRMED' }));
            await expect(service.deliver('order-1')).rejects.toThrow(BadRequestException);
        });

        it('marks a SHIPPED order as DELIVERED', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status: 'SHIPPED' }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'DELIVERED' }));
            const result = await service.deliver('order-1');
            expect(result.status).toBe('DELIVERED');
        });
    });

    describe('markReceived', () => {
        it('throws BadRequestException when the requesting user does not own the order', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'user-1', status: 'SHIPPED' }));
            await expect(service.markReceived('order-1', 'someone-else')).rejects.toThrow(BadRequestException);
        });

        it('throws BadRequestException when order has not been shipped yet', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'user-1', status: 'PENDING' }));
            await expect(service.markReceived('order-1', 'user-1')).rejects.toThrow(BadRequestException);
        });

        it('marks a SHIPPED order as DELIVERED for its owner', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ userId: 'user-1', status: 'SHIPPED' }));
            prismaMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'DELIVERED' }));
            const result = await service.markReceived('order-1', 'user-1');
            expect(result.status).toBe('DELIVERED');
        });
    });

    describe('cancel', () => {
        it.each(['DELIVERED', 'CANCELLED', 'REFUNDED'])('throws BadRequestException for status %s', async (status) => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ status }));
            await expect(service.cancel('order-1')).rejects.toThrow(BadRequestException);
        });

        it('restores stock for each item and sets status CANCELLED', async () => {
            prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({
                status: 'CONFIRMED',
                items: [{ productId: 'p1', quantity: 2 }],
            }));
            txMock.order.update.mockResolvedValueOnce(makeOrder({ status: 'CANCELLED' }));

            const result = await service.cancel('order-1');

            expect(txMock.product.update).toHaveBeenCalledWith({
                where: { id: 'p1' },
                data: { stock: { increment: 2 } },
            });
            expect(txMock.order.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'order-1' }, data: { status: 'CANCELLED' } }),
            );
            expect(result.status).toBe('CANCELLED');
        });
    });

    describe('purgeAll', () => {
        it('deletes all order items and orders and returns the deleted count', async () => {
            prismaMock.order.count.mockResolvedValueOnce(7);

            const result = await service.purgeAll();

            expect(prismaMock.orderItem.deleteMany).toHaveBeenCalledWith({});
            expect(prismaMock.order.deleteMany).toHaveBeenCalledWith({});
            expect(result).toEqual({ deleted: 7 });
        });
    });
});

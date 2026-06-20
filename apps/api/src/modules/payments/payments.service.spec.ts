import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../../common/services/email.service';

function makeOrder(overrides: Partial<any> = {}) {
    return {
        id: 'order-1',
        paymentIntentId: 'pi_test_123',
        paymentMethod: 'stripe',
        refundId: null,
        total: 99.99,
        status: 'CONFIRMED',
        ...overrides,
    };
}

describe('PaymentsService.refundOrder', () => {
    let service: PaymentsService;
    let prismaMock: any;
    let settingsMock: any;

    beforeEach(async () => {
        prismaMock = {
            order: {
                findUnique: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>().mockResolvedValue(makeOrder({ status: 'REFUNDED', refundId: 're_123' })),
            },
            product: { findMany: jest.fn() },
        };
        settingsMock = {
            get: jest.fn<() => Promise<string | null>>().mockResolvedValue('test'),
            set: jest.fn(),
            mask: jest.fn((v: string | null) => v),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: SettingsService, useValue: settingsMock },
                { provide: EmailService, useValue: { sendAdminPaymentAlert: jest.fn() } },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('throws NotFoundException when order does not exist', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(null);
        await expect(service.refundOrder('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when order has no paymentIntentId', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ paymentIntentId: null }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when paymentMethod is not stripe', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ paymentMethod: 'dev' }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when order already has a refundId', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder({ refundId: 're_already' }));
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when Stripe key is not configured', async () => {
        prismaMock.order.findUnique.mockResolvedValueOnce(makeOrder());
        settingsMock.get.mockResolvedValue(null);
        await expect(service.refundOrder('order-1')).rejects.toThrow(BadRequestException);
    });
});

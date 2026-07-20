import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ShippingService } from '../shipping/shipping.service';

function makeRepair(overrides: Partial<any> = {}) {
    return {
        id: 'repair-1',
        reference: 'REP-001',
        userId: 'user-1',
        brand: 'Apple',
        model: 'iPhone 13',
        status: 'SUBMITTED',
        images: ['img1.jpg'],
        contact: { name: 'Jo', email: 'jo@example.com', phone: '123', address: '', postcode: '' },
        fulfillment: 'ship',
        quote: null,
        adminNotes: null,
        ...overrides,
    };
}

describe('RepairsService', () => {
    let service: RepairsService;
    let prismaMock: any;
    let storageMock: any;
    let notificationsMock: any;
    let shippingMock: any;

    beforeEach(async () => {
        prismaMock = {
            user: { findUnique: jest.fn<() => Promise<any>>() },
            repair: {
                create: jest.fn<() => Promise<any>>(),
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
                findUnique: jest.fn<() => Promise<any>>(),
                findFirst: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                deleteMany: jest.fn<() => Promise<any>>(),
            },
        };
        storageMock = {
            generatePresignedUrl: jest.fn<(k: string) => Promise<string>>().mockImplementation((k: any) => Promise.resolve(`https://cdn/${k}`)),
            deleteFiles: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        };
        notificationsMock = { create: jest.fn<() => Promise<any>>().mockResolvedValue(undefined) };
        shippingMock = {
            generatePrepaidLabel: jest.fn<() => Promise<any>>().mockResolvedValue({ trackingNumber: 'TRK-1' }),
            sendLabelEmail: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RepairsService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: StorageService, useValue: storageMock },
                { provide: NotificationsService, useValue: notificationsMock },
                { provide: ShippingService, useValue: shippingMock },
            ],
        }).compile();

        service = module.get<RepairsService>(RepairsService);
    });

    describe('submit', () => {
        it('creates a repair with the raw dto contact when no userId is given', async () => {
            prismaMock.repair.create.mockResolvedValueOnce(makeRepair());
            await service.submit({ contact: { name: 'Guest' }, deviceType: 'phone', brand: 'Apple', model: 'iPhone', issue: 'screen', images: [], fulfillment: 'ship' } as any);
            const data = prismaMock.repair.create.mock.calls[0][0].data;
            expect(data.contact).toEqual({ name: 'Guest' });
            expect(data.userId).toBeUndefined();
        });

        it('merges user profile fields into contact when userId matches an existing user', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce({
                name: 'Real Name', email: 'real@example.com', phone: '999', address: '1 St', postcode: 'AB1',
            });
            prismaMock.repair.create.mockResolvedValueOnce(makeRepair());
            await service.submit({ contact: { name: 'Guest' }, deviceType: 'phone', brand: 'Apple', model: 'iPhone', issue: 'screen', images: [], fulfillment: 'ship' } as any, 'user-1');
            const data = prismaMock.repair.create.mock.calls[0][0].data;
            expect(data.contact).toEqual({ name: 'Real Name', email: 'real@example.com', phone: '999', address: '1 St', postcode: 'AB1' });
        });

        it('falls back to dto contact fields when user profile fields are empty', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce({ name: '', email: '', phone: '', address: '', postcode: '' });
            prismaMock.repair.create.mockResolvedValueOnce(makeRepair());
            await service.submit({ contact: { name: 'Guest', email: 'guest@x.com' }, deviceType: 'phone', brand: 'Apple', model: 'iPhone', issue: 'screen', images: [], fulfillment: 'ship' } as any, 'user-1');
            const data = prismaMock.repair.create.mock.calls[0][0].data;
            expect(data.contact.name).toBe('Guest');
            expect(data.contact.email).toBe('guest@x.com');
        });
    });

    describe('findById', () => {
        it('throws NotFoundException when repair does not exist', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(null);
            await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
        });

        it('resolves presigned urls for images and drops failures', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ images: ['a.jpg', 'b.jpg'] }));
            storageMock.generatePresignedUrl
                .mockResolvedValueOnce('https://cdn/a.jpg')
                .mockRejectedValueOnce(new Error('missing'));
            const result = await service.findById('repair-1');
            expect(result.images).toEqual(['https://cdn/a.jpg']);
        });
    });

    describe('findByReference', () => {
        it('throws NotFoundException when repair not found', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(null);
            await expect(service.findByReference('REP-999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('setQuote', () => {
        it('throws BadRequestException when repair is not SUBMITTED/APPROVED', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'COMPLETED' }));
            await expect(service.setQuote('repair-1', { quote: 100 } as any)).rejects.toThrow(BadRequestException);
        });

        it('sets QUOTE_SENT status and notifies the user', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'SUBMITTED' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT', quote: 150 }));
            const result = await service.setQuote('repair-1', { quote: 150 } as any);
            expect(result.status).toBe('QUOTE_SENT');
            expect(notificationsMock.create).toHaveBeenCalledWith(
                'user-1', 'repair_quote_sent', expect.any(String), expect.any(String), expect.any(Object),
            );
        });

        it('does not notify when repair has no userId (guest)', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'APPROVED', userId: null }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT' }));
            await service.setQuote('repair-1', { quote: 100 } as any);
            expect(notificationsMock.create).not.toHaveBeenCalled();
        });
    });

    describe('startRepair', () => {
        it('throws BadRequestException when repair is not APPROVED', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'SUBMITTED' }));
            await expect(service.startRepair('repair-1')).rejects.toThrow(BadRequestException);
        });

        it('moves an APPROVED repair to IN_PROGRESS', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'IN_PROGRESS' }));
            const result = await service.startRepair('repair-1');
            expect(result.status).toBe('IN_PROGRESS');
        });
    });

    describe('completeRepair', () => {
        it('throws BadRequestException when repair is not IN_PROGRESS', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }));
            await expect(service.completeRepair('repair-1', {} as any)).rejects.toThrow(BadRequestException);
        });

        it('completes an IN_PROGRESS repair and keeps existing adminNotes when none supplied', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'IN_PROGRESS', adminNotes: 'old note' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'COMPLETED' }));
            await service.completeRepair('repair-1', {} as any);
            const data = prismaMock.repair.update.mock.calls[0][0].data;
            expect(data.adminNotes).toBe('old note');
        });
    });

    describe('acceptQuote', () => {
        it('throws NotFoundException when repair not found for user', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(null);
            await expect(service.acceptQuote('repair-1', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException when status is not QUOTE_SENT', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'SUBMITTED' }));
            await expect(service.acceptQuote('repair-1', 'user-1')).rejects.toThrow(BadRequestException);
        });

        it('approves and generates a prepaid shipping label for ship fulfillment', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT', fulfillment: 'ship' }));
            prismaMock.repair.update
                .mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }))
                .mockResolvedValueOnce(makeRepair({ status: 'APPROVED', trackingNumber: 'TRK-1' }));
            const result = await service.acceptQuote('repair-1', 'user-1');
            expect(shippingMock.generatePrepaidLabel).toHaveBeenCalled();
            expect(shippingMock.sendLabelEmail).toHaveBeenCalled();
            expect(prismaMock.repair.update).toHaveBeenCalledTimes(2);
            expect(result.status).toBe('APPROVED');
        });

        it('does not attempt a shipping label for drop-off fulfillment', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT', fulfillment: 'dropoff' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }));
            await service.acceptQuote('repair-1', 'user-1');
            expect(shippingMock.generatePrepaidLabel).not.toHaveBeenCalled();
            expect(prismaMock.repair.update).toHaveBeenCalledTimes(1);
        });

        it('swallows shipping label failures and still returns the approved repair', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT', fulfillment: 'ship' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }));
            shippingMock.generatePrepaidLabel.mockRejectedValueOnce(new Error('carrier down'));
            const result = await service.acceptQuote('repair-1', 'user-1');
            expect(result.status).toBe('APPROVED');
            expect(prismaMock.repair.update).toHaveBeenCalledTimes(1);
        });
    });

    describe('declineQuote', () => {
        it('throws NotFoundException when repair not found for user', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(null);
            await expect(service.declineQuote('repair-1', 'user-1')).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException when status is not QUOTE_SENT', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'APPROVED' }));
            await expect(service.declineQuote('repair-1', 'user-1')).rejects.toThrow(BadRequestException);
        });

        it('cancels the repair and notifies the user', async () => {
            prismaMock.repair.findFirst.mockResolvedValueOnce(makeRepair({ status: 'QUOTE_SENT' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'CANCELLED' }));
            const result = await service.declineQuote('repair-1', 'user-1');
            expect(result.status).toBe('CANCELLED');
            expect(notificationsMock.create).toHaveBeenCalledWith('user-1', 'repair_cancelled', expect.any(String), expect.any(String), expect.any(Object));
        });
    });

    describe('cancelRepair', () => {
        it('throws BadRequestException when repair is already COMPLETED or CANCELLED', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'COMPLETED' }));
            await expect(service.cancelRepair('repair-1')).rejects.toThrow(BadRequestException);
        });

        it('cancels an active repair and notifies the user', async () => {
            prismaMock.repair.findUnique.mockResolvedValueOnce(makeRepair({ status: 'IN_PROGRESS' }));
            prismaMock.repair.update.mockResolvedValueOnce(makeRepair({ status: 'CANCELLED' }));
            const result = await service.cancelRepair('repair-1');
            expect(result.status).toBe('CANCELLED');
            expect(notificationsMock.create).toHaveBeenCalled();
        });
    });

    describe('purgeAll', () => {
        it('deletes stored images and all repairs, returning the deleted image count', async () => {
            prismaMock.repair.findMany.mockResolvedValueOnce([{ images: ['a.jpg'] }, { images: ['b.jpg', 'c.jpg'] }]);
            const result = await service.purgeAll();
            expect(storageMock.deleteFiles).toHaveBeenCalledWith(['a.jpg', 'b.jpg', 'c.jpg']);
            expect(prismaMock.repair.deleteMany).toHaveBeenCalled();
            expect(result).toEqual({ deleted: 3 });
        });

        it('skips storage.deleteFiles when there are no images', async () => {
            prismaMock.repair.findMany.mockResolvedValueOnce([]);
            const result = await service.purgeAll();
            expect(storageMock.deleteFiles).not.toHaveBeenCalled();
            expect(result).toEqual({ deleted: 0 });
        });
    });
});

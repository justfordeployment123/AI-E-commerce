import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';

jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

function makeUser(overrides: Partial<any> = {}) {
    return {
        id: 'user-1',
        email: 'jane@example.com',
        name: 'Jane Doe',
        phone: '07000000000',
        address: '1 High Street',
        city: 'Leicester',
        postcode: 'LE1 1AA',
        role: 'CUSTOMER',
        passwordHash: 'hashed-password',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}

describe('UsersService', () => {
    let service: UsersService;
    let prismaMock: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        prismaMock = {
            user: {
                findUnique: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
                findMany: jest.fn<() => Promise<any>>().mockResolvedValue([]),
                count: jest.fn<() => Promise<any>>().mockResolvedValue(0),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    describe('findById', () => {
        it('throws NotFoundException when the user does not exist', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
        });

        it('returns the user with the safe select fields', async () => {
            const user = makeUser();
            prismaMock.user.findUnique.mockResolvedValueOnce(user);
            const result = await service.findById('user-1');
            const selectArg = prismaMock.user.findUnique.mock.calls[0][0].select;
            expect(selectArg).not.toHaveProperty('passwordHash');
            expect(result).toBe(user);
        });
    });

    describe('update', () => {
        it('throws NotFoundException when the user does not exist', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(null);
            await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });

        it('only includes defined fields in the update data', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());
            const updated = makeUser({ name: 'New Name' });
            prismaMock.user.update.mockResolvedValueOnce(updated);

            const result = await service.update('user-1', { name: 'New Name' });

            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { name: 'New Name' },
                select: expect.any(Object),
            });
            expect(result).toBe(updated);
        });

        it('omits fields that are undefined on the dto', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());
            await service.update('user-1', { phone: '0700', city: undefined } as any);
            const call = prismaMock.user.update.mock.calls[0][0];
            expect(call.data).toEqual({ phone: '0700' });
        });
    });

    describe('changePassword', () => {
        it('throws NotFoundException when the user does not exist', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(null);
            await expect(
                service.changePassword('missing', { currentPassword: 'a', newPassword: 'newpassword' }),
            ).rejects.toThrow(NotFoundException);
        });

        it('throws BadRequestException when the current password is incorrect', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());
            (bcrypt.compare as jest.Mock<any>).mockResolvedValueOnce(false as never);

            await expect(
                service.changePassword('user-1', { currentPassword: 'wrong', newPassword: 'newpassword' }),
            ).rejects.toThrow(BadRequestException);
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });

        it('hashes and stores the new password when the current password is correct', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());
            (bcrypt.compare as jest.Mock<any>).mockResolvedValueOnce(true as never);
            (bcrypt.hash as jest.Mock<any>).mockResolvedValueOnce('new-hashed' as never);

            const result = await service.changePassword('user-1', { currentPassword: 'correct', newPassword: 'newpassword' });

            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 12);
            expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { passwordHash: 'new-hashed' } });
            expect(result).toEqual({ ok: true });
        });

        it('skips the current-password check for google-only accounts with no passwordHash', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: null }));
            (bcrypt.hash as jest.Mock<any>).mockResolvedValueOnce('new-hashed' as never);

            const result = await service.changePassword('user-1', { currentPassword: '', newPassword: 'newpassword' });

            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(result).toEqual({ ok: true });
        });
    });

    describe('findAll', () => {
        it('applies default pagination', async () => {
            prismaMock.user.findMany.mockResolvedValueOnce([makeUser()]);
            prismaMock.user.count.mockResolvedValueOnce(1);

            const result = await service.findAll();

            expect(prismaMock.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
            );
            expect(result).toEqual({ items: [makeUser()], total: 1, page: 1, limit: 20, pages: 1 });
        });

        it('clamps limit to a maximum of 100', async () => {
            await service.findAll({ page: 1, limit: 500 });
            const call = prismaMock.user.findMany.mock.calls[0][0];
            expect(call.take).toBe(100);
        });

        it('computes skip from page and limit', async () => {
            await service.findAll({ page: 3, limit: 10 });
            const call = prismaMock.user.findMany.mock.calls[0][0];
            expect(call.skip).toBe(20);
        });
    });
});

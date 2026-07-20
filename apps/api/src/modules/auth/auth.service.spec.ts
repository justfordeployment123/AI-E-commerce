import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

function makeUser(overrides: Partial<any> = {}) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        passwordHash: 'hashed-password',
        googleId: null,
        createdAt: new Date('2024-01-01'),
        ...overrides,
    };
}

describe('AuthService', () => {
    let service: AuthService;
    let prismaMock: any;
    let jwtMock: any;

    beforeEach(async () => {
        jest.clearAllMocks();

        prismaMock = {
            user: {
                findUnique: jest.fn<() => Promise<any>>(),
                findFirst: jest.fn<() => Promise<any>>(),
                create: jest.fn<() => Promise<any>>(),
                update: jest.fn<() => Promise<any>>(),
            },
        };
        jwtMock = {
            sign: jest.fn().mockReturnValue('signed-token'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: JwtService, useValue: jwtMock },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('register()', () => {
        it('throws ConflictException when the email is already registered', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());

            await expect(
                service.register({ email: 'test@example.com', password: 'pw', name: 'Test' } as any),
            ).rejects.toThrow(ConflictException);
            expect(prismaMock.user.create).not.toHaveBeenCalled();
        });

        it('hashes the password, creates the user, and returns a signed token', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(null);
            (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-pw' as never);
            const created = makeUser({ passwordHash: undefined });
            prismaMock.user.create.mockResolvedValueOnce(created);

            const result = await service.register({
                email: 'test@example.com',
                password: 'plaintext',
                name: 'Test User',
                phone: '123',
            } as any);

            expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 12);
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { email: 'test@example.com', passwordHash: 'hashed-pw', name: 'Test User', phone: '123' },
                select: { id: true, email: true, name: true, role: true, createdAt: true },
            });
            expect(jwtMock.sign).toHaveBeenCalledWith({ sub: created.id, email: created.email, role: created.role });
            expect(result).toEqual({ user: created, token: 'signed-token' });
        });
    });

    describe('login()', () => {
        it('throws UnauthorizedException when no user is found', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(null);

            await expect(
                service.login({ email: 'nope@example.com', password: 'pw' } as any),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the user has no passwordHash (google-only account)', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: null }));

            await expect(
                service.login({ email: 'test@example.com', password: 'pw' } as any),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when the password does not match', async () => {
            prismaMock.user.findUnique.mockResolvedValueOnce(makeUser());
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false as never);

            await expect(
                service.login({ email: 'test@example.com', password: 'wrong' } as any),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('returns the user (without passwordHash) and a signed token on success', async () => {
            const user = makeUser();
            prismaMock.user.findUnique.mockResolvedValueOnce(user);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true as never);

            const result = await service.login({ email: 'test@example.com', password: 'correct' } as any);

            expect(bcrypt.compare).toHaveBeenCalledWith('correct', 'hashed-password');
            expect(result.user).not.toHaveProperty('passwordHash');
            expect(result.token).toBe('signed-token');
        });
    });

    describe('googleLogin()', () => {
        it('creates a new user when no matching account exists', async () => {
            prismaMock.user.findFirst.mockResolvedValueOnce(null);
            const created = makeUser({ googleId: 'g-123', passwordHash: null });
            prismaMock.user.create.mockResolvedValueOnce(created);

            const result = await service.googleLogin({ googleId: 'g-123', email: 'new@example.com', name: 'New' });

            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: { email: 'new@example.com', name: 'New', googleId: 'g-123' },
            });
            expect(prismaMock.user.update).not.toHaveBeenCalled();
            expect(result).toEqual({ token: 'signed-token' });
        });

        it('links googleId to an existing account that does not have one yet', async () => {
            const existing = makeUser({ googleId: null });
            prismaMock.user.findFirst.mockResolvedValueOnce(existing);
            const updated = makeUser({ googleId: 'g-456' });
            prismaMock.user.update.mockResolvedValueOnce(updated);

            await service.googleLogin({ googleId: 'g-456', email: existing.email, name: existing.name });

            expect(prismaMock.user.update).toHaveBeenCalledWith({
                where: { id: existing.id },
                data: { googleId: 'g-456' },
            });
        });

        it('does not touch the user record when googleId is already linked', async () => {
            const existing = makeUser({ googleId: 'g-existing' });
            prismaMock.user.findFirst.mockResolvedValueOnce(existing);

            await service.googleLogin({ googleId: 'g-existing', email: existing.email, name: existing.name });

            expect(prismaMock.user.create).not.toHaveBeenCalled();
            expect(prismaMock.user.update).not.toHaveBeenCalled();
        });
    });
});

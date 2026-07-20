import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

jest.mock('redis', () => ({
    createClient: jest.fn(),
}));

function makeMockClient(overrides: Partial<any> = {}) {
    return {
        isOpen: false,
        on: jest.fn(),
        connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        quit: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        ping: jest.fn<() => Promise<string>>().mockResolvedValue('PONG'),
        ...overrides,
    };
}

async function createService(): Promise<RedisService> {
    const module: TestingModule = await Test.createTestingModule({
        providers: [RedisService],
    }).compile();
    return module.get<RedisService>(RedisService);
}

describe('RedisService', () => {
    const originalUrl = process.env.REDIS_URL;
    let mockClient: ReturnType<typeof makeMockClient>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = makeMockClient();
        (createClient as jest.Mock).mockReturnValue(mockClient);
    });

    afterEach(() => {
        if (originalUrl === undefined) delete process.env.REDIS_URL;
        else process.env.REDIS_URL = originalUrl;
    });

    describe('onModuleInit()', () => {
        it('warns and skips connecting when REDIS_URL is not set', async () => {
            delete process.env.REDIS_URL;
            const service = await createService();

            await service.onModuleInit();

            expect(createClient).not.toHaveBeenCalled();
            expect(() => service.getClient()).toThrow('Redis client is not initialized');
        });

        it('creates and connects a client when REDIS_URL is set', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            const service = await createService();

            await service.onModuleInit();

            expect(createClient).toHaveBeenCalledWith(
                expect.objectContaining({ url: 'redis://localhost:6379' }),
            );
            expect(mockClient.connect).toHaveBeenCalledTimes(1);
            expect(service.getClient()).toBe(mockClient);
        });

        it('swallows connection errors so app startup does not fail', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            mockClient.connect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
            const service = await createService();

            await expect(service.onModuleInit()).resolves.toBeUndefined();
        });
    });

    describe('getClient()', () => {
        it('throws when the client has not been initialized', async () => {
            delete process.env.REDIS_URL;
            const service = await createService();
            expect(() => service.getClient()).toThrow('Redis client is not initialized');
        });
    });

    describe('ping()', () => {
        it('throws when REDIS_URL is not set', async () => {
            delete process.env.REDIS_URL;
            const service = await createService();
            await expect(service.ping()).rejects.toThrow('Redis is unavailable');
        });

        it('ensures a connection then delegates to the client', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            const service = await createService();

            const result = await service.ping();

            expect(mockClient.connect).toHaveBeenCalledTimes(1);
            expect(mockClient.ping).toHaveBeenCalledTimes(1);
            expect(result).toBe('PONG');
        });

        it('does not reconnect if the client is already open', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            mockClient.isOpen = true;
            const service = await createService();

            await service.ping();

            expect(mockClient.connect).not.toHaveBeenCalled();
        });
    });

    describe('onModuleDestroy()', () => {
        it('quits and clears the client when one exists', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            const service = await createService();
            await service.onModuleInit();

            await service.onModuleDestroy();

            expect(mockClient.quit).toHaveBeenCalledTimes(1);
            expect(() => service.getClient()).toThrow('Redis client is not initialized');
        });

        it('does nothing when no client was ever created', async () => {
            delete process.env.REDIS_URL;
            const service = await createService();
            await expect(service.onModuleDestroy()).resolves.toBeUndefined();
        });

        it('swallows errors thrown while quitting', async () => {
            process.env.REDIS_URL = 'redis://localhost:6379';
            const service = await createService();
            await service.onModuleInit();
            mockClient.quit.mockRejectedValueOnce(new Error('already closed'));

            await expect(service.onModuleDestroy()).resolves.toBeUndefined();
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SettingsService } from './settings.service';
import { PrismaService } from '../database/prisma.service';

function makePrismaMock() {
    return {
        appSetting: {
            findUnique: jest.fn<() => Promise<any>>().mockResolvedValue(null),
            upsert: jest.fn<() => Promise<any>>().mockResolvedValue({}),
        },
    };
}

describe('SettingsService', () => {
    let service: SettingsService;
    let prismaMock: ReturnType<typeof makePrismaMock>;

    beforeEach(async () => {
        process.env.ENCRYPTION_KEY = 'a'.repeat(64);
        prismaMock = makePrismaMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettingsService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<SettingsService>(SettingsService);
        service.onModuleInit();
    });

    describe('encrypt / decrypt round-trip', () => {
        it('decrypts to original plaintext after set+get', async () => {
            const plain = 'sk_test_abc123def456';
            await service.set('STRIPE_SECRET_KEY_TEST', plain);

            const upsertCall = (prismaMock.appSetting.upsert as any).mock.calls[0][0];
            const stored = upsertCall.create.encryptedValue;

            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce({
                key: 'STRIPE_SECRET_KEY_TEST',
                encryptedValue: stored,
            });
            service['cache'].clear();

            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBe(plain);
        });

        it('produces different ciphertext for same plaintext (random IV)', async () => {
            await service.set('STRIPE_SECRET_KEY_TEST', 'same-value');
            await service.set('STRIPE_SECRET_KEY_TEST', 'same-value');

            const calls = (prismaMock.appSetting.upsert as any).mock.calls;
            const stored1 = calls[0][0].create.encryptedValue;
            const stored2 = calls[1][0].create.encryptedValue;
            expect(stored1).not.toBe(stored2);
        });
    });

    describe('get()', () => {
        it('returns cached value without hitting DB', async () => {
            service['cache'].set('STRIPE_SECRET_KEY_TEST', 'cached_value');
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBe('cached_value');
            expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
        });

        it('does not fall back to process.env when DB has no row', async () => {
            process.env['STRIPE_SECRET_KEY_TEST'] = 'env_fallback_value';
            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce(null);
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBeNull();
            delete process.env['STRIPE_SECRET_KEY_TEST'];
        });

        it('returns null when DB has no row and env is unset', async () => {
            delete process.env['STRIPE_SECRET_KEY_TEST'];
            (prismaMock.appSetting.findUnique as any).mockResolvedValueOnce(null);
            const result = await service.get('STRIPE_SECRET_KEY_TEST');
            expect(result).toBeNull();
        });
    });

    describe('set()', () => {
        it('stores STRIPE_MODE without encryption (plaintext)', async () => {
            await service.set('STRIPE_MODE', 'live');
            const call = (prismaMock.appSetting.upsert as any).mock.calls[0][0];
            expect(call.update.encryptedValue).toBe('live');
            expect(call.create.encryptedValue).toBe('live');
        });

        it('clears cache entry after set so next get re-fetches', async () => {
            service['cache'].set('STRIPE_SECRET_KEY_TEST', 'old_value');
            await service.set('STRIPE_SECRET_KEY_TEST', 'new_value');
            expect(service['cache'].has('STRIPE_SECRET_KEY_TEST')).toBe(false);
        });
    });

    describe('mask()', () => {
        it('shows key type prefix and last 4 chars', () => {
            expect(service.mask('sk_live_abcdefghij1234')).toBe('sk_live_****1234');
            expect(service.mask('sk_test_abcdefghij5678')).toBe('sk_test_****5678');
            expect(service.mask('whsec_abcdefghij9012')).toBe('whsec_****9012');
        });

        it('returns null for null input', () => {
            expect(service.mask(null)).toBeNull();
        });
    });
});

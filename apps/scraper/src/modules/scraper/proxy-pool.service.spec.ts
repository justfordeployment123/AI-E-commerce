import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProxyPoolService } from './proxy-pool.service';

describe('ProxyPoolService', () => {
    const ORIGINAL_ENV = process.env.SCRAPER_PROXIES;

    afterEach(() => {
        if (ORIGINAL_ENV === undefined) delete process.env.SCRAPER_PROXIES;
        else process.env.SCRAPER_PROXIES = ORIGINAL_ENV;
    });

    describe('with no SCRAPER_PROXIES configured', () => {
        beforeEach(() => { delete process.env.SCRAPER_PROXIES; });

        it('is disabled', () => {
            expect(new ProxyPoolService().enabled).toBe(false);
        });

        it('next() always returns null', () => {
            const pool = new ProxyPoolService();
            expect(pool.next()).toBeNull();
            expect(pool.next()).toBeNull();
        });
    });

    describe('with SCRAPER_PROXIES configured', () => {
        beforeEach(() => {
            process.env.SCRAPER_PROXIES =
                'http://user1:pass1@proxy1.example.com:8000,http://proxy2.example.com:8001';
        });

        it('is enabled', () => {
            expect(new ProxyPoolService().enabled).toBe(true);
        });

        it('parses server/username/password out of each proxy URL', () => {
            const pool = new ProxyPoolService();
            const first = pool.next();
            expect(first).toEqual({
                server: 'http://proxy1.example.com:8000',
                username: 'user1',
                password: 'pass1',
            });
        });

        it('parses a proxy URL with no credentials', () => {
            const pool = new ProxyPoolService();
            pool.next(); // proxy1
            const second = pool.next();
            expect(second).toEqual({
                server: 'http://proxy2.example.com:8001',
                username: undefined,
                password: undefined,
            });
        });

        it('round-robins back to the first proxy after the last', () => {
            const pool = new ProxyPoolService();
            const a = pool.next();
            pool.next();
            const c = pool.next();
            expect(c).toEqual(a);
        });

        it('skips a proxy that was marked bad until its cooldown expires', () => {
            const pool = new ProxyPoolService();
            const first = pool.next()!;
            pool.markBad(first, 60_000);
            const second = pool.next();
            expect(second?.server).not.toBe(first.server);
            const third = pool.next();
            expect(third?.server).not.toBe(first.server);
        });

        it('falls back to reusing a proxy if every proxy is in cooldown', () => {
            const pool = new ProxyPoolService();
            const a = pool.next()!;
            const b = pool.next()!;
            pool.markBad(a, 60_000);
            pool.markBad(b, 60_000);
            expect(pool.next()).not.toBeNull();
        });

        it('markBad on an unknown proxy is a no-op', () => {
            const pool = new ProxyPoolService();
            expect(() => pool.markBad({ server: 'http://not-in-pool.example.com:1' })).not.toThrow();
        });
    });

    describe('with a malformed proxy entry', () => {
        beforeEach(() => {
            process.env.SCRAPER_PROXIES = 'not-a-valid-url,http://proxy2.example.com:8001';
        });

        it('skips the malformed entry and keeps the valid ones', () => {
            const pool = new ProxyPoolService();
            expect(pool.enabled).toBe(true);
            expect(pool.next()).toEqual({
                server: 'http://proxy2.example.com:8001',
                username: undefined,
                password: undefined,
            });
        });
    });

    describe('redact()', () => {
        it('strips credentials, keeps protocol/host/port', () => {
            const pool = new ProxyPoolService();
            expect(pool.redact('http://user:pass@proxy.example.com:8000')).toBe('http://proxy.example.com:8000');
        });

        it('returns a placeholder for an invalid URL', () => {
            const pool = new ProxyPoolService();
            expect(pool.redact('not a url')).toBe('(invalid proxy url)');
        });
    });
});

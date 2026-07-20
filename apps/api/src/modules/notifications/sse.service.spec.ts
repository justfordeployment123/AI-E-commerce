import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SseService } from './sse.service';

describe('SseService', () => {
    let service: SseService;

    beforeEach(() => {
        service = new SseService();
    });

    afterEach(() => {
        service.onModuleDestroy();
        jest.useRealTimers();
    });

    describe('subscribe / unsubscribe', () => {
        it('returns a Subject that receives events emitted for that user', () => {
            const subject = service.subscribe('user-1');
            const received: any[] = [];
            subject.subscribe((v) => received.push(v));

            service.emit('user-1', { type: 'PING' });

            expect(received).toEqual([{ data: JSON.stringify({ type: 'PING' }) }]);
        });

        it('supports multiple concurrent subscribers for the same user', () => {
            const sub1 = service.subscribe('user-1');
            const sub2 = service.subscribe('user-1');
            const received1: any[] = [];
            const received2: any[] = [];
            sub1.subscribe((v) => received1.push(v));
            sub2.subscribe((v) => received2.push(v));

            service.emit('user-1', { type: 'EVENT' });

            expect(received1).toHaveLength(1);
            expect(received2).toHaveLength(1);
        });

        it('does not deliver events to a different user', () => {
            const subject = service.subscribe('user-1');
            const received: any[] = [];
            subject.subscribe((v) => received.push(v));

            service.emit('user-2', { type: 'EVENT' });

            expect(received).toHaveLength(0);
        });

        it('emit is a no-op when the user has no subscribers', () => {
            expect(() => service.emit('unknown-user', { type: 'EVENT' })).not.toThrow();
        });

        it('unsubscribe completes the subject and stops further delivery', () => {
            const subject = service.subscribe('user-1');
            let completed = false;
            const received: any[] = [];
            subject.subscribe({ next: (v) => received.push(v), complete: () => { completed = true; } });

            service.unsubscribe('user-1', subject);
            service.emit('user-1', { type: 'AFTER_UNSUBSCRIBE' });

            expect(completed).toBe(true);
            expect(received).toHaveLength(0);
        });

        it('removes the user entry entirely once the last subscriber unsubscribes', () => {
            const subject = service.subscribe('user-1');
            service.unsubscribe('user-1', subject);

            // Re-subscribing should work cleanly (no leftover empty Set causing issues)
            const subject2 = service.subscribe('user-1');
            const received: any[] = [];
            subject2.subscribe((v) => received.push(v));
            service.emit('user-1', { type: 'EVENT' });
            expect(received).toHaveLength(1);
        });

        it('unsubscribe is safe to call for a user with no active subscriptions', () => {
            const subject = service.subscribe('user-1');
            service.unsubscribe('user-1', subject);
            expect(() => service.unsubscribe('user-1', subject)).not.toThrow();
        });
    });

    describe('heartbeat', () => {
        it('sends a __ping__ payload to all subscribers every 25 seconds', () => {
            jest.useFakeTimers();
            service.onModuleInit();

            const subject = service.subscribe('user-1');
            const received: any[] = [];
            subject.subscribe((v) => received.push(v));

            jest.advanceTimersByTime(25_000);

            expect(received).toEqual([{ data: JSON.stringify({ type: '__ping__' }) }]);
        });
    });

    describe('onModuleDestroy', () => {
        it('completes all active subscriptions and clears the client map', () => {
            const subject = service.subscribe('user-1');
            let completed = false;
            subject.subscribe({ complete: () => { completed = true; } });

            service.onModuleDestroy();

            expect(completed).toBe(true);
            // Emitting after destroy should be a no-op since the map is cleared
            expect(() => service.emit('user-1', { type: 'EVENT' })).not.toThrow();
        });

        it('clears the heartbeat timer so it does not keep firing', () => {
            jest.useFakeTimers();
            service.onModuleInit();
            service.onModuleDestroy();

            const subject = service.subscribe('user-1');
            const received: any[] = [];
            subject.subscribe((v) => received.push(v));

            jest.advanceTimersByTime(50_000);

            expect(received).toHaveLength(0);
        });
    });
});

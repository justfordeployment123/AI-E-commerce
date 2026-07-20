import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CartService, CartItem } from './cart.service';
import { RedisService } from '../cache/redis.service';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
    return { productId: 'p-1', quantity: 1, price: 100, name: 'Widget', slug: 'widget', ...overrides };
}

describe('CartService', () => {
    let service: CartService;
    let clientMock: any;
    let redisMock: any;

    beforeEach(async () => {
        clientMock = {
            get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
            set: jest.fn<() => Promise<any>>().mockResolvedValue('OK'),
            del: jest.fn<() => Promise<any>>().mockResolvedValue(1),
        };
        redisMock = { getClient: jest.fn().mockReturnValue(clientMock) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [CartService, { provide: RedisService, useValue: redisMock }],
        }).compile();

        service = module.get<CartService>(CartService);
    });

    describe('get()', () => {
        it('returns an empty array when no cart is stored', async () => {
            clientMock.get.mockResolvedValueOnce(null);
            const result = await service.get('cart-1');
            expect(result).toEqual([]);
            expect(clientMock.get).toHaveBeenCalledWith('cart:cart-1');
        });

        it('parses and returns the stored JSON items', async () => {
            const items = [makeItem()];
            clientMock.get.mockResolvedValueOnce(JSON.stringify(items));
            const result = await service.get('cart-1');
            expect(result).toEqual(items);
        });
    });

    describe('set()', () => {
        it('stores the items as JSON with a 7-day TTL', async () => {
            const items = [makeItem()];
            await service.set('cart-1', items);
            expect(clientMock.set).toHaveBeenCalledWith('cart:cart-1', JSON.stringify(items), { EX: 60 * 60 * 24 * 7 });
        });
    });

    describe('addItem()', () => {
        it('appends a new item when the product is not already in the cart', async () => {
            clientMock.get.mockResolvedValueOnce(JSON.stringify([]));
            const result = await service.addItem('cart-1', makeItem({ productId: 'p-1' }));
            expect(result).toEqual([makeItem({ productId: 'p-1' })]);
        });

        it('increments the quantity when the product already exists in the cart', async () => {
            clientMock.get.mockResolvedValueOnce(JSON.stringify([makeItem({ productId: 'p-1', quantity: 2 })]));
            const result = await service.addItem('cart-1', makeItem({ productId: 'p-1', quantity: 3 }));
            expect(result).toEqual([makeItem({ productId: 'p-1', quantity: 5 })]);
        });
    });

    describe('updateItem()', () => {
        it('returns items unchanged (and does not persist) when the product is not found', async () => {
            clientMock.get.mockResolvedValueOnce(JSON.stringify([makeItem({ productId: 'p-1' })]));
            const result = await service.updateItem('cart-1', 'p-missing', 5);
            expect(result).toEqual([makeItem({ productId: 'p-1' })]);
            expect(clientMock.set).not.toHaveBeenCalled();
        });

        it('removes the item when the new quantity is 0 or less', async () => {
            clientMock.get.mockResolvedValueOnce(JSON.stringify([makeItem({ productId: 'p-1' })]));
            const result = await service.updateItem('cart-1', 'p-1', 0);
            expect(result).toEqual([]);
            expect(clientMock.set).toHaveBeenCalled();
        });

        it('updates the quantity when positive', async () => {
            clientMock.get.mockResolvedValueOnce(JSON.stringify([makeItem({ productId: 'p-1', quantity: 1 })]));
            const result = await service.updateItem('cart-1', 'p-1', 7);
            expect(result).toEqual([makeItem({ productId: 'p-1', quantity: 7 })]);
        });
    });

    describe('removeItem()', () => {
        it('filters out the given product and persists the result', async () => {
            clientMock.get.mockResolvedValueOnce(
                JSON.stringify([makeItem({ productId: 'p-1' }), makeItem({ productId: 'p-2' })]),
            );
            const result = await service.removeItem('cart-1', 'p-1');
            expect(result).toEqual([makeItem({ productId: 'p-2' })]);
            expect(clientMock.set).toHaveBeenCalledWith('cart:cart-1', JSON.stringify(result), expect.any(Object));
        });
    });

    describe('clear()', () => {
        it('deletes the cart key', async () => {
            await service.clear('cart-1');
            expect(clientMock.del).toHaveBeenCalledWith('cart:cart-1');
        });
    });
});

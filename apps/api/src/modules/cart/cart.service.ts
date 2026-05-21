import { Injectable } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

export interface CartItem {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
    slug: string;
}

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class CartService {
    constructor(private readonly redis: RedisService) {}

    private key(cartId: string) {
        return `cart:${cartId}`;
    }

    async get(cartId: string): Promise<CartItem[]> {
        const client = this.redis.getClient();
        const raw = await client.get(this.key(cartId));
        return raw ? (JSON.parse(raw) as CartItem[]) : [];
    }

    async set(cartId: string, items: CartItem[]): Promise<void> {
        const client = this.redis.getClient();
        await client.set(this.key(cartId), JSON.stringify(items), { EX: TTL_SECONDS });
    }

    async addItem(cartId: string, item: CartItem): Promise<CartItem[]> {
        const items = await this.get(cartId);
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            items.push(item);
        }
        await this.set(cartId, items);
        return items;
    }

    async updateItem(cartId: string, productId: string, quantity: number): Promise<CartItem[]> {
        const items = await this.get(cartId);
        const idx = items.findIndex((i) => i.productId === productId);
        if (idx === -1) return items;
        if (quantity <= 0) {
            items.splice(idx, 1);
        } else {
            items[idx]!.quantity = quantity;
        }
        await this.set(cartId, items);
        return items;
    }

    async removeItem(cartId: string, productId: string): Promise<CartItem[]> {
        const items = (await this.get(cartId)).filter((i) => i.productId !== productId);
        await this.set(cartId, items);
        return items;
    }

    async clear(cartId: string): Promise<void> {
        const client = this.redis.getClient();
        await client.del(this.key(cartId));
    }
}

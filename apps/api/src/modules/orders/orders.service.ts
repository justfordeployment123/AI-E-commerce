import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ShipOrderDto } from './dto/ship-order.dto';

const ORDER_INCLUDE = {
    items: {
        include: {
            product: {
                select: { id: true, name: true, slug: true, images: true, condition: true },
            },
        },
    },
    user: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateOrderDto, userId?: string) {
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('One or more products not found or unavailable');
        }

        // Check stock and compute totals
        const lineItems = dto.items.map((item) => {
            const product = products.find((p: { id: string }) => p.id === item.productId)!;
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for ${product.name}`);
            }
            return { productId: item.productId, quantity: item.quantity, price: product.price };
        });

        const subtotal = lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0);
        const shipping = subtotal >= 100 ? 0 : 5.99;
        const total = subtotal + shipping;

        const order = await this.prisma.$transaction(async (tx) => {
            // Decrement stock
            for (const li of lineItems) {
                await tx.product.update({
                    where: { id: li.productId },
                    data: { stock: { decrement: li.quantity } },
                });
            }

            return tx.order.create({
                data: {
                    userId,
                    subtotal,
                    shipping,
                    total,
                    shippingAddress: dto.shippingAddress as object,
                    paymentMethod: dto.paymentMethod,
                    notes: dto.notes,
                    items: {
                        create: lineItems,
                    },
                },
                include: ORDER_INCLUDE,
            });
        });

        return order;
    }

    async findAll(query: { status?: string; page?: number; limit?: number }) {
        const { status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = status ? { status: status as never } : {};

        const [items, total] = await Promise.all([
            this.prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: ORDER_INCLUDE }),
            this.prisma.order.count({ where }),
        ]);

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        const order = await this.prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async findByUser(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: ORDER_INCLUDE,
        });
    }

    async update(id: string, dto: UpdateOrderDto) {
        await this.findById(id);
        return this.prisma.order.update({ where: { id }, data: dto as never });
    }

    async confirm(id: string) {
        const order = await this.findById(id);
        if (order.status !== 'PENDING') {
            throw new BadRequestException(`Cannot confirm an order with status ${order.status}`);
        }
        return this.prisma.order.update({ where: { id }, data: { status: 'CONFIRMED' } });
    }

    async ship(id: string, dto: ShipOrderDto) {
        const order = await this.findById(id);
        if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
            throw new BadRequestException(`Cannot ship an order with status ${order.status}`);
        }
        return this.prisma.order.update({
            where: { id },
            data: {
                status: 'SHIPPED',
                trackingNumber: dto.trackingNumber,
                notes: dto.notes ?? order.notes,
            },
            include: ORDER_INCLUDE,
        });
    }

    async deliver(id: string) {
        const order = await this.findById(id);
        if (order.status !== 'SHIPPED') {
            throw new BadRequestException(`Cannot mark delivered an order with status ${order.status}`);
        }
        return this.prisma.order.update({ where: { id }, data: { status: 'DELIVERED' } });
    }

    async cancel(id: string) {
        const order = await this.findById(id);
        if (['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
            throw new BadRequestException(`Cannot cancel an order with status ${order.status}`);
        }

        // Restore stock
        return this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            return tx.order.update({ where: { id }, data: { status: 'CANCELLED' }, include: ORDER_INCLUDE });
        });
    }
}

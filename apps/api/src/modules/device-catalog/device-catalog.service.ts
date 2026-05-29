import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { UpsertDeviceDto } from './dto/upsert-device.dto';

@Injectable()
export class DeviceCatalogService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    findAll(params?: { category?: string; search?: string; isActive?: boolean }) {
        const where: Record<string, unknown> = {};
        if (params?.category) where.category = params.category;
        if (params?.isActive !== undefined) where.isActive = params.isActive;
        if (params?.search) {
            where.OR = [
                { brand: { contains: params.search, mode: 'insensitive' } },
                { model: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.deviceCatalog.findMany({ where, orderBy: [{ brand: 'asc' }, { model: 'asc' }] });
    }

    create(dto: UpsertDeviceDto) {
        return this.prisma.deviceCatalog.create({ data: dto });
    }

    async update(id: string, dto: Partial<UpsertDeviceDto>) {
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        return this.prisma.deviceCatalog.update({ where: { id }, data: dto });
    }

    async findOne(id: string) {
        const item = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!item) throw new NotFoundException('Device not found');
        return item;
    }

    async remove(id: string) {
        if (id === 'all') {
            // Collect all product image keys before deleting
            const products = await this.prisma.product.findMany({ select: { images: true } });
            const imageKeys = products.flatMap(p => p.images as string[]).filter(Boolean);

            await this.prisma.orderItem.deleteMany({});
            await this.prisma.product.deleteMany({});
            await this.prisma.deviceCatalog.deleteMany({});

            // Delete images from Garage after DB records are gone
            await this.storage.deleteFiles(imageKeys);

            return { message: 'All devices and products deleted' };
        }
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');

        // Cascade-delete linked products + their Garage images
        const linkedProducts = await this.prisma.product.findMany({
            where: { catalogId: id },
            select: { id: true, images: true },
        });
        if (linkedProducts.length) {
            const productIds = linkedProducts.map(p => p.id);
            const imageKeys = linkedProducts.flatMap(p => p.images as string[]).filter(Boolean);
            await this.prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } });
            await this.prisma.product.deleteMany({ where: { id: { in: productIds } } });
            await this.storage.deleteFiles(imageKeys);
        }

        await this.prisma.deviceCatalog.delete({ where: { id } });
        return { message: 'Device removed' };
    }
}

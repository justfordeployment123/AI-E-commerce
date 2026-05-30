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

    findAll(params?: { categorySlug?: string; brandSlug?: string; search?: string; isActive?: boolean }) {
        const where: Record<string, unknown> = {};
        if (params?.isActive !== undefined) where.isActive = params.isActive;
        if (params?.categorySlug) {
            where.brandCategory = { category: { slug: params.categorySlug } };
        }
        if (params?.brandSlug) {
            where.brandCategory = { brand: { slug: params.brandSlug } };
        }
        if (params?.search) {
            where.model = { contains: params.search, mode: 'insensitive' };
        }
        return this.prisma.deviceCatalog.findMany({
            where,
            include: { brandCategory: { include: { brand: true, category: true } } },
            orderBy: { model: 'asc' },
        });
    }

    create(dto: UpsertDeviceDto) {
        return this.prisma.deviceCatalog.create({
            data: dto,
            include: { brandCategory: { include: { brand: true, category: true } } },
        });
    }

    async update(id: string, dto: Partial<UpsertDeviceDto>) {
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');
        return this.prisma.deviceCatalog.update({
            where: { id },
            data: dto,
            include: { brandCategory: { include: { brand: true, category: true } } },
        });
    }

    async findOne(id: string) {
        const item = await this.prisma.deviceCatalog.findUnique({
            where: { id },
            include: { brandCategory: { include: { brand: true, category: true } } },
        });
        if (!item) throw new NotFoundException('Device not found');
        return item;
    }

    async remove(id: string) {
        if (id === 'all') {
            const products = await this.prisma.product.findMany({ select: { images: true } });
            const imageKeys = products.flatMap(p => p.images as string[]).filter(Boolean);

            await this.prisma.orderItem.deleteMany({});
            await this.prisma.product.deleteMany({});
            await this.prisma.deviceCatalog.deleteMany({});

            await this.storage.deleteFiles(imageKeys);

            return { message: 'All devices and products deleted' };
        }
        const existing = await this.prisma.deviceCatalog.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Device not found');

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

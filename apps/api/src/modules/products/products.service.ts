import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private async presignImages(product: any) {
        const images = await Promise.all(
            (product.images as string[]).map(img => this.storage.resolveImageUrl(img)),
        );
        return { ...product, images: images.filter(Boolean) as string[] };
    }

    async create(dto: CreateProductDto) {
        const baseSlug = slugify(`${dto.brand}-${dto.model}-${dto.condition}`);
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
        }
        return this.prisma.product.create({ data: { ...dto, slug, images: dto.images ?? [], specs: (dto.specs ?? {}) as never } });
    }

    async findAll(query: {
        category?: string;
        brand?: string;
        condition?: string;
        minPrice?: number;
        maxPrice?: number;
        search?: string;
        page?: number;
        limit?: number;
        includeInactive?: boolean;
    }) {
        const { category, brand, condition, minPrice, maxPrice, search, page = 1, limit = 20, includeInactive } = query;
        const safeLimit = Math.min(limit, 200);
        const skip = (page - 1) * safeLimit;

        const where: Record<string, unknown> = {};
        if (!includeInactive) where.isActive = true;
        if (category) where.category = { equals: category, mode: 'insensitive' };
        if (brand) where.brand = brand;
        if (condition) where.condition = condition;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = { gte: minPrice, lte: maxPrice };
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [rawItems, total] = await Promise.all([
            this.prisma.product.findMany({ where, skip, take: safeLimit, orderBy: { createdAt: 'desc' } }),
            this.prisma.product.count({ where }),
        ]);

        const items = await Promise.all(rawItems.map(p => this.presignImages(p)));
        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }

    async getBrands(category?: string) {
        const where: Record<string, unknown> = { isActive: true };
        if (category) where.category = { equals: category, mode: 'insensitive' };

        const rows = await this.prisma.product.findMany({
            where,
            select: { brand: true, images: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });

        const result: { brand: string; image: string | null }[] = [];
        for (const row of rows) {
            const images = row.images as string[];
            const resolved = images[0] ? await this.storage.resolveImageUrl(images[0]) : null;
            result.push({ brand: row.brand, image: resolved });
        }
        return result;
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({ where: { slug } });
        if (!product) throw new NotFoundException('Product not found');
        return this.presignImages(product);
    }

    async findById(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        const presigned = await this.presignImages(product);
        // rawImages = original S3 keys (or external URLs) as stored in DB,
        // so the client never accidentally writes presigned URLs back.
        return { ...presigned, rawImages: product.images as string[] };
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.prisma.product.findUniqueOrThrow({ where: { id } });
        return this.prisma.product.update({ where: { id }, data: dto as never });
    }

    async remove(id: string) {
        await this.prisma.product.findUniqueOrThrow({ where: { id } });
        await this.prisma.product.delete({ where: { id } });
        return { message: 'Product deleted' };
    }
}

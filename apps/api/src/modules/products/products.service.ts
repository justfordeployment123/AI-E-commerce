import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
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
    constructor(private readonly prisma: PrismaService) {}

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
    }) {
        const { category, brand, condition, minPrice, maxPrice, search, page = 1, limit = 20 } = query;
        const safeLimit = Math.min(limit, 100);
        const skip = (page - 1) * safeLimit;

        const where: Record<string, unknown> = { isActive: true };
        if (category) where.category = category;
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

        const [items, total] = await Promise.all([
            this.prisma.product.findMany({ where, skip, take: safeLimit, orderBy: { createdAt: 'desc' } }),
            this.prisma.product.count({ where }),
        ]);

        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({ where: { slug } });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async findById(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.findById(id);
        return this.prisma.product.update({ where: { id }, data: dto as never });
    }

    async remove(id: string) {
        await this.findById(id);
        await this.prisma.product.delete({ where: { id } });
        return { message: 'Product deleted' };
    }
}

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

const CATALOG_INCLUDE = { catalog: { select: { brand: true, model: true, category: true } } } as const;

@Injectable()
export class ProductsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private async presignAndFlatten(product: any) {
        const images = await Promise.all(
            (product.images as string[]).map((img: string) => this.storage.resolveImageUrl(img)),
        );
        const { catalog, ...rest } = product;
        return {
            ...rest,
            images: images.filter(Boolean) as string[],
            brand: catalog?.brand ?? '',
            model: catalog?.model ?? '',
            category: catalog?.category ?? '',
        };
    }

    async create(dto: CreateProductDto) {
        const catalog = await this.prisma.deviceCatalog.findUnique({ where: { id: dto.catalogId } });
        if (!catalog) throw new NotFoundException('Device catalog entry not found');

        const storage = dto.storage ?? '';
        const baseSlug = slugify(`${catalog.brand}-${catalog.model}-${dto.condition}${storage ? `-${storage}` : ''}`);
        let slug = baseSlug;
        let counter = 1;
        while (await this.prisma.product.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter++}`;
        }

        // Add storage to catalog's storageOptions if not already there
        if (storage && !(catalog.storageOptions as string[]).includes(storage)) {
            await this.prisma.deviceCatalog.update({
                where: { id: dto.catalogId },
                data: { storageOptions: { push: storage } },
            });
        }

        const { catalogId, storage: _s, ...rest } = dto;
        const product = await this.prisma.product.create({
            data: { ...rest, catalogId, storage, slug, images: dto.images ?? [], specs: (dto.specs ?? {}) as never },
            include: CATALOG_INCLUDE,
        });
        return this.presignAndFlatten(product);
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
        if (condition) where.condition = condition;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = { gte: minPrice, lte: maxPrice };
        }

        const catalogWhere: Record<string, unknown> = {};
        if (category) catalogWhere.category = { equals: category, mode: 'insensitive' };
        if (brand) catalogWhere.brand = { equals: brand, mode: 'insensitive' };
        if (Object.keys(catalogWhere).length > 0) where.catalog = { is: catalogWhere };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { catalog: { is: { brand: { contains: search, mode: 'insensitive' } } } },
                { catalog: { is: { model: { contains: search, mode: 'insensitive' } } } },
            ];
        }

        const [rawItems, total] = await Promise.all([
            this.prisma.product.findMany({ where, skip, take: safeLimit, orderBy: { createdAt: 'desc' }, include: CATALOG_INCLUDE }),
            this.prisma.product.count({ where }),
        ]);

        const items = await Promise.all(rawItems.map(p => this.presignAndFlatten(p)));
        return { items, total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    }

    async getBrands(category?: string) {
        const catalogWhere: Record<string, unknown> = { isActive: true };
        if (category) catalogWhere.category = { equals: category, mode: 'insensitive' };

        const rows = await this.prisma.deviceCatalog.findMany({
            where: catalogWhere,
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });

        const result: { brand: string; image: string | null }[] = [];
        for (const row of rows) {
            const product = await this.prisma.product.findFirst({
                where: { catalog: { is: { brand: row.brand } }, isActive: true },
                select: { images: true },
            });
            const images = product?.images as string[] | null;
            const resolved = images?.[0] ? await this.storage.resolveImageUrl(images[0]) : null;
            result.push({ brand: row.brand, image: resolved });
        }
        return result;
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({ where: { slug }, include: CATALOG_INCLUDE });
        if (!product) throw new NotFoundException('Product not found');
        return this.presignAndFlatten(product);
    }

    async findById(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id }, include: CATALOG_INCLUDE });
        if (!product) throw new NotFoundException('Product not found');
        const presigned = await this.presignAndFlatten(product);
        return { ...presigned, rawImages: product.images as string[] };
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.prisma.product.findUniqueOrThrow({ where: { id } });
        return this.prisma.product.update({ where: { id }, data: dto as never });
    }

    async remove(id: string) {
        if (id === 'all') {
            await this.prisma.orderItem.deleteMany({});
            await this.prisma.product.deleteMany({});
            return { message: 'All products deleted' };
        }
        await this.prisma.product.findUniqueOrThrow({ where: { id } });
        await this.prisma.product.delete({ where: { id } });
        return { message: 'Product deleted' };
    }
}

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateBrandCategoryDto } from './dto/create-brand-category.dto';

const MAX_BRAND_CATEGORY_IMAGES = 10;

@Injectable()
export class CatalogService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    // ─── Categories ──────────────────────────────────────────────────────────

    async listCategories(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        const categories = await this.prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { brandCategories: true } } },
        });

        const [productCounts, minPrices, modelCounts] = await Promise.all([
            Promise.all(
                categories.map(c =>
                    this.prisma.product
                        .count({ where: { catalog: { brandCategory: { categoryId: c.id } } } })
                        .then(count => ({ id: c.id, productCount: count })),
                ),
            ),
            Promise.all(
                categories.map(c =>
                    this.prisma.product
                        .findFirst({
                            where: {
                                catalog: { brandCategory: { categoryId: c.id } },
                                stock: { gt: 0 },
                            },
                            orderBy: { price: 'asc' },
                            select: { price: true },
                        })
                        .then(p => ({ id: c.id, minPrice: p?.price ?? null })),
                ),
            ),
            Promise.all(
                categories.map(c =>
                    this.prisma.deviceCatalog
                        .count({ where: { brandCategory: { categoryId: c.id }, isActive: true } })
                        .then(count => ({ id: c.id, modelCount: count })),
                ),
            ),
        ]);

        const countMap = new Map(productCounts.map(c => [c.id, c.productCount]));
        const priceMap = new Map(minPrices.map(c => [c.id, c.minPrice]));
        const modelCountMap = new Map(modelCounts.map(c => [c.id, c.modelCount]));

        return Promise.all(categories.map(async c => ({
            ...c,
            slug: c.name.toLowerCase(),   // computed from name — slug column was removed from DB
            image: c.image ? await this.storage.resolveImageUrl(c.image) : null,
            images: await Promise.all(
                ((c.images as string[]) ?? []).map(img => this.storage.resolveImageUrl(img)),
            ),
            productCount: countMap.get(c.id) ?? 0,
            minPrice: priceMap.get(c.id) ?? null,
            modelCount: modelCountMap.get(c.id) ?? 0,
        })));
    }

    async getCategory(id: string) {
        const cat = await this.prisma.category.findUnique({
            where: { id },
            include: { brandCategories: { include: { brand: true } } },
        });
        if (!cat) throw new NotFoundException('Category not found');
        return cat;
    }

    async createCategory(dto: CreateCategoryDto) {
        return this.prisma.category.create({ data: dto });
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
        await this.getCategory(id);
        return this.prisma.category.update({ where: { id }, data: dto });
    }

    async uploadCategoryImage(id: string, file: any) {
        const cat = await this.getCategory(id);
        const { filePath } = await this.storage.uploadFile(file, `catalog/categories/${cat.name.toLowerCase()}`);
        return this.prisma.category.update({ where: { id }, data: { image: filePath } });
    }

    async presignCategoryImage(id: string, filename: string, contentType: string) {
        const cat = await this.getCategory(id);
        const key = this.storage.buildKey(`catalog/categories/${cat.name.toLowerCase()}`, filename);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    async saveCategoryImageKey(id: string, key: string) {
        const cat = await this.getCategory(id);
        // Add to images array and set as primary image if first
        const images = [...new Set([...cat.images, key])];
        return this.prisma.category.update({
            where: { id },
            data: { image: cat.image ?? key, images },
        });
    }

    async addCategoryImage(id: string, key: string) {
        const cat = await this.getCategory(id);
        const images = [...new Set([...cat.images, key])];
        return this.prisma.category.update({
            where: { id },
            data: { image: cat.image ?? key, images },
        });
    }

    async deleteCategoryImage(id: string, imageKey: string) {
        const cat = await this.getCategory(id);
        const images = (cat.images as string[]).filter(img => img !== imageKey);
        const newPrimary = cat.image === imageKey ? (images[0] ?? null) : cat.image;
        await this.storage.deleteFiles([imageKey]).catch(() => {});
        return this.prisma.category.update({
            where: { id },
            data: { image: newPrimary, images },
        });
    }

    async deleteCategory(id: string) {
        await this.getCategory(id);
        return this.prisma.category.delete({ where: { id } });
    }

    // ─── Brands ──────────────────────────────────────────────────────────────

    async listBrands(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };
        const brands = await this.prisma.brand.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { brandCategories: true } } },
        });

        const productCounts = await Promise.all(
            brands.map(b =>
                this.prisma.product
                    .count({ where: { catalog: { brandCategory: { brandId: b.id } } } })
                    .then(count => ({ id: b.id, productCount: count })),
            ),
        );
        const countMap = new Map(productCounts.map(c => [c.id, c.productCount]));
        return Promise.all(
            brands.map(async b => ({
                ...b,
                logo: b.logo ? await this.storage.resolveImageUrl(b.logo) : null,
                productCount: countMap.get(b.id) ?? 0,
            })),
        );
    }

    async getBrand(id: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
            include: { brandCategories: { include: { category: true } } },
        });
        if (!brand) throw new NotFoundException('Brand not found');
        return brand;
    }

    async getBrandBySlug(slug: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { slug },
            include: {
                brandCategories: {
                    where: { isActive: true },
                    include: { category: true },
                },
            },
        });
        if (!brand) throw new NotFoundException('Brand not found');
        return {
            ...brand,
            logo: brand.logo ? await this.storage.resolveImageUrl(brand.logo) : null,
            brandCategories: await Promise.all(
                (brand.brandCategories ?? []).map(async bc => ({
                    ...bc,
                    category: {
                        ...bc.category,
                        image: bc.category.image ? await this.storage.resolveImageUrl(bc.category.image) : null,
                    },
                    images: await Promise.all(
                        ((bc.images as string[]) ?? []).map(img => this.storage.resolveImageUrl(img)),
                    ),
                })),
            ),
        };
    }

    async createBrand(dto: CreateBrandDto) {
        return this.prisma.brand.create({ data: dto });
    }

    async updateBrand(id: string, dto: Partial<CreateBrandDto>) {
        await this.getBrand(id);
        return this.prisma.brand.update({ where: { id }, data: dto });
    }

    async uploadBrandLogo(id: string, file: any) {
        const brand = await this.getBrand(id);
        const { filePath } = await this.storage.uploadFile(file, `catalog/brands/${brand.slug}`);
        return this.prisma.brand.update({ where: { id }, data: { logo: filePath } });
    }

    async presignBrandLogo(id: string, filename: string, contentType: string) {
        const brand = await this.getBrand(id);
        const key = this.storage.buildKey(`catalog/brands/${brand.slug}`, filename);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    async saveBrandLogoKey(id: string, key: string) {
        return this.prisma.brand.update({ where: { id }, data: { logo: key } });
    }

    async deleteBrand(id: string) {
        await this.getBrand(id);
        return this.prisma.brand.delete({ where: { id } });
    }

    // ─── Brand-Categories ─────────────────────────────────────────────────────

    async listBrandCategories(includeInactive = false, brandId?: string) {
        const where: Record<string, unknown> = includeInactive ? {} : { isActive: true };
        if (brandId) where.brandId = brandId;
        const bcs = await this.prisma.brandCategory.findMany({
            where,
            include: { brand: true, category: true },
            orderBy: [{ category: { name: 'asc' } }, { brand: { name: 'asc' } }],
        });
        return Promise.all(
            bcs.map(async bc => ({
                ...bc,
                brand: {
                    ...bc.brand,
                    logo: bc.brand.logo ? await this.storage.resolveImageUrl(bc.brand.logo) : null,
                },
                category: {
                    ...bc.category,
                    image: bc.category.image ? await this.storage.resolveImageUrl(bc.category.image) : null,
                },
                images: await Promise.all(
                    ((bc.images as string[]) ?? []).map(img => this.storage.resolveImageUrl(img)),
                ),
            })),
        );
    }

    async getBrandCategory(id: string) {
        const bc = await this.prisma.brandCategory.findUnique({
            where: { id },
            include: { brand: true, category: true },
        });
        if (!bc) throw new NotFoundException('BrandCategory not found');
        return bc;
    }

    async createBrandCategory(dto: CreateBrandCategoryDto) {
        return this.prisma.brandCategory.upsert({
            where: { brandId_categoryId: { brandId: dto.brandId, categoryId: dto.categoryId } },
            create: { ...dto, images: [] },
            update: { isActive: true },
            include: { brand: true, category: true },
        });
    }

    async updateBrandCategory(id: string, dto: Partial<CreateBrandCategoryDto & { isActive: boolean }>) {
        await this.getBrandCategory(id);
        return this.prisma.brandCategory.update({
            where: { id },
            data: dto,
            include: { brand: true, category: true },
        });
    }

    async uploadBrandCategoryImage(id: string, file: any) {
        const bc = await this.getBrandCategory(id);
        const images = (bc.images as string[]) ?? [];
        if (images.length >= MAX_BRAND_CATEGORY_IMAGES) {
            throw new BadRequestException(`Maximum ${MAX_BRAND_CATEGORY_IMAGES} images allowed per brand-category`);
        }
        const { filePath } = await this.storage.uploadFile(file, `catalog/categories/${bc.category.name.toLowerCase()}/${bc.brand.slug}`);
        return this.prisma.brandCategory.update({
            where: { id },
            data: { images: [...images, filePath] },
            include: { brand: true, category: true },
        });
    }

    async presignBrandCategoryImage(id: string, filename: string, contentType: string) {
        const bc = await this.getBrandCategory(id);
        const images = (bc.images as string[]) ?? [];
        if (images.length >= MAX_BRAND_CATEGORY_IMAGES) {
            throw new BadRequestException(`Maximum ${MAX_BRAND_CATEGORY_IMAGES} images allowed per brand-category`);
        }
        const key = this.storage.buildKey(`catalog/categories/${bc.category.name.toLowerCase()}/${bc.brand.slug}`, filename);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    async saveBrandCategoryImageKey(id: string, key: string) {
        const bc = await this.getBrandCategory(id);
        const images = (bc.images as string[]) ?? [];
        if (images.length >= MAX_BRAND_CATEGORY_IMAGES) {
            throw new BadRequestException(`Maximum ${MAX_BRAND_CATEGORY_IMAGES} images allowed per brand-category`);
        }
        return this.prisma.brandCategory.update({
            where: { id },
            data: { images: [...images, key] },
            include: { brand: true, category: true },
        });
    }

    async deleteBrandCategoryImage(id: string, imageKey: string) {
        const bc = await this.getBrandCategory(id);
        const images = (bc.images as string[]) ?? [];
        const decodedKey = decodeURIComponent(imageKey);
        if (!images.includes(decodedKey)) {
            throw new NotFoundException('Image not found in this brand-category');
        }
        await this.storage.deleteFiles([decodedKey]);
        return this.prisma.brandCategory.update({
            where: { id },
            data: { images: images.filter(i => i !== decodedKey) },
            include: { brand: true, category: true },
        });
    }

    async deleteBrandCategory(id: string) {
        const bc = await this.getBrandCategory(id);
        const images = (bc.images as string[]) ?? [];
        if (images.length) await this.storage.deleteFiles(images);
        return this.prisma.brandCategory.delete({ where: { id } });
    }

    // ─── Public: brand page products ─────────────────────────────────────────

    async getBrandProducts(slug: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { slug },
            include: {
                brandCategories: {
                    where: { isActive: true },
                    include: {
                        category: true,
                        deviceCatalogs: {
                            where: { isActive: true },
                            include: {
                                products: {
                                    where: { isActive: true, stock: { gt: 0 } },
                                    take: 8,
                                    orderBy: { createdAt: 'desc' },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!brand) throw new NotFoundException('Brand not found');

        const resolvedBrandCategories = await Promise.all(
            (brand.brandCategories ?? []).map(async bc => {
                const resolvedDeviceCatalogs = await Promise.all(
                    (bc.deviceCatalogs ?? []).map(async dc => {
                        const resolvedProducts = await Promise.all(
                            (dc.products ?? []).map(async p => ({
                                ...p,
                                images: await Promise.all(
                                    ((p.images as string[]) ?? []).map(img => this.storage.resolveImageUrl(img)),
                                ),
                            })),
                        );
                        return {
                            ...dc,
                            products: resolvedProducts,
                        };
                    }),
                );

                return {
                    ...bc,
                    category: {
                        ...bc.category,
                        image: bc.category.image ? await this.storage.resolveImageUrl(bc.category.image) : null,
                    },
                    images: await Promise.all(
                        ((bc.images as string[]) ?? []).map(img => this.storage.resolveImageUrl(img)),
                    ),
                    deviceCatalogs: resolvedDeviceCatalogs,
                };
            }),
        );

        return {
            ...brand,
            logo: brand.logo ? await this.storage.resolveImageUrl(brand.logo) : null,
            brandCategories: resolvedBrandCategories,
        };
    }
}

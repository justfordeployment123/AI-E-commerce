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
            image: c.image ? await this.storage.resolveImageUrl(c.image) : null,
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
        const { filePath } = await this.storage.uploadFile(file, `catalog/categories/${cat.slug}`);
        return this.prisma.category.update({ where: { id }, data: { image: filePath } });
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
        return this.prisma.brandCategory.create({
            data: dto,
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
        const { filePath } = await this.storage.uploadFile(file, `catalog/categories/${bc.category.slug}/${bc.brand.slug}`);
        const updated = await this.prisma.brandCategory.update({
            where: { id },
            data: { images: [...images, filePath] },
            include: { brand: true, category: true },
        });
        return updated;
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

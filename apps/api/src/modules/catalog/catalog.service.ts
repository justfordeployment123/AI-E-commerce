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
        return this.prisma.category.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { brandCategories: true } } },
        });
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
        return this.prisma.brand.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { brandCategories: true } } },
        });
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
        return brand;
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
        return this.prisma.brandCategory.findMany({
            where,
            include: { brand: true, category: true },
            orderBy: [{ category: { name: 'asc' } }, { brand: { name: 'asc' } }],
        });
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
        const { filePath } = await this.storage.uploadFile(file, `catalog/${bc.category.slug}/${bc.brand.slug}`);
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
        return brand;
    }
}

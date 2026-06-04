import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOtherBrandDto } from './dto/create-other-brand.dto';
import { CreateOtherSubcategoryDto } from './dto/create-other-subcategory.dto';

@Injectable()
export class OtherCatalogService {
    constructor(private readonly prisma: PrismaService) {}

    // ─── OtherBrand ─────────────────────────────────────────────────────────────

    listBrands() {
        return this.prisma.otherBrand.findMany({ orderBy: { name: 'asc' } });
    }

    createBrand(dto: CreateOtherBrandDto) {
        return this.prisma.otherBrand.create({ data: { name: dto.name.trim() } });
    }

    updateBrand(id: string, dto: Partial<CreateOtherBrandDto>) {
        return this.prisma.otherBrand.update({ where: { id }, data: { name: dto.name?.trim() } });
    }

    async deleteBrand(id: string) {
        const count = await this.prisma.product.count({ where: { otherBrandId: id } });
        if (count > 0) throw new BadRequestException(`Cannot delete: ${count} product(s) use this brand`);
        await this.prisma.otherBrand.delete({ where: { id } });
        return { message: 'Deleted' };
    }

    // ─── OtherSubcategory ────────────────────────────────────────────────────────

    listSubcategories() {
        return this.prisma.otherSubcategory.findMany({ orderBy: { name: 'asc' } });
    }

    createSubcategory(dto: CreateOtherSubcategoryDto) {
        return this.prisma.otherSubcategory.create({ data: { name: dto.name.trim() } });
    }

    updateSubcategory(id: string, dto: Partial<CreateOtherSubcategoryDto>) {
        return this.prisma.otherSubcategory.update({ where: { id }, data: { name: dto.name?.trim() } });
    }

    async deleteSubcategory(id: string) {
        const count = await this.prisma.product.count({ where: { otherSubcategoryId: id } });
        if (count > 0) throw new BadRequestException(`Cannot delete: ${count} product(s) use this subcategory`);
        await this.prisma.otherSubcategory.delete({ where: { id } });
        return { message: 'Deleted' };
    }
}

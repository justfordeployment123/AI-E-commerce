import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateBrandCategoryDto } from './dto/create-brand-category.dto';

// ─── Categories ────────────────────────────────────────────────────────────────

@Controller('catalog/categories')
export class CategoriesController {
    constructor(private readonly catalog: CatalogService) {}

    @Get()
    list(@Query('includeInactive') includeInactive?: string) {
        return this.catalog.listCategories(includeInactive === 'true');
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.catalog.getCategory(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateCategoryDto) {
        return this.catalog.createCategory(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
        return this.catalog.updateCategory(id, dto);
    }

    @Post(':id/image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
        return this.catalog.uploadCategoryImage(id, file);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.catalog.deleteCategory(id);
    }
}

// ─── Brands ────────────────────────────────────────────────────────────────────

@Controller('catalog/brands')
export class BrandsController {
    constructor(private readonly catalog: CatalogService) {}

    @Get()
    list(@Query('includeInactive') includeInactive?: string) {
        return this.catalog.listBrands(includeInactive === 'true');
    }

    @Get(':slug')
    getBySlug(@Param('slug') slug: string) {
        return this.catalog.getBrandBySlug(slug);
    }

    @Get(':slug/products')
    getBrandProducts(@Param('slug') slug: string) {
        return this.catalog.getBrandProducts(slug);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateBrandDto) {
        return this.catalog.createBrand(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateBrandDto>) {
        return this.catalog.updateBrand(id, dto);
    }

    @Post(':id/logo')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadLogo(@Param('id') id: string, @UploadedFile() file: any) {
        return this.catalog.uploadBrandLogo(id, file);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.catalog.deleteBrand(id);
    }
}

// ─── Brand-Categories ──────────────────────────────────────────────────────────

@Controller('catalog/brand-categories')
export class BrandCategoriesController {
    constructor(private readonly catalog: CatalogService) {}

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    list(@Query('includeInactive') includeInactive?: string) {
        return this.catalog.listBrandCategories(includeInactive === 'true');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    getOne(@Param('id') id: string) {
        return this.catalog.getBrandCategory(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateBrandCategoryDto) {
        return this.catalog.createBrandCategory(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateBrandCategoryDto & { isActive: boolean }>) {
        return this.catalog.updateBrandCategory(id, dto);
    }

    @Post(':id/images')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(@Param('id') id: string, @UploadedFile() file: any) {
        return this.catalog.uploadBrandCategoryImage(id, file);
    }

    @Delete(':id/images/:imageKey')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deleteImage(@Param('id') id: string, @Param('imageKey') imageKey: string) {
        return this.catalog.deleteBrandCategoryImage(id, imageKey);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.catalog.deleteBrandCategory(id);
    }
}

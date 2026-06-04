import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OtherCatalogService } from './other-catalog.service';
import { CreateOtherBrandDto } from './dto/create-other-brand.dto';
import { CreateOtherSubcategoryDto } from './dto/create-other-subcategory.dto';

@Controller('other-brands')
export class OtherBrandsController {
    constructor(private readonly svc: OtherCatalogService) {}

    @Get()
    list() { return this.svc.listBrands(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateOtherBrandDto) { return this.svc.createBrand(dto); }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateOtherBrandDto>) { return this.svc.updateBrand(id, dto); }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) { return this.svc.deleteBrand(id); }
}

@Controller('other-subcategories')
export class OtherSubcategoriesController {
    constructor(private readonly svc: OtherCatalogService) {}

    @Get()
    list() { return this.svc.listSubcategories(); }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    create(@Body() dto: CreateOtherSubcategoryDto) { return this.svc.createSubcategory(dto); }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() dto: Partial<CreateOtherSubcategoryDto>) { return this.svc.updateSubcategory(id, dto); }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) { return this.svc.deleteSubcategory(id); }
}

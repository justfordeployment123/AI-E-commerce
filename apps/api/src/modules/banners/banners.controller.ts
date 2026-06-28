import {
    BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post,
    Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('banners')
export class BannersController {
    constructor(private readonly banners: BannersService) {}

    // ── Banner Images ────────────────────────────────────────────────────────

    @Get('random')
    getRandom(@Query('count') count?: string) {
        return this.banners.getRandom(count ? Math.min(Number(count), 10) : 4);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    listAllBanners() {
        return this.banners.listAllBanners();
    }

    @Get('presign-upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    presignBanner(@Query('filename') filename: string, @Query('contentType') contentType: string) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        return this.banners.presignBanner(filename, contentType);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadBanner(@UploadedFile() file: any, @Body('label') label?: string, @Body('key') key?: string) {
        if (key) return this.banners.saveBannerKey(key, label);
        if (file) return this.banners.uploadBanner(file, label);
        throw new BadRequestException('Provide a file or a key');
    }

    @Patch(':id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    toggleBanner(@Param('id') id: string) {
        return this.banners.toggleBanner(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deleteBanner(@Param('id') id: string) {
        return this.banners.deleteBanner(id);
    }

    // ── Promo Slides ─────────────────────────────────────────────────────────
    // Static sub-paths declared BEFORE parameterised :id paths.

    @Get('promo-slides')
    getPromoSlides() {
        return this.banners.getPromoSlides();
    }

    @Get('promo-slides/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    listAllPromoSlides() {
        return this.banners.listAllPromoSlides();
    }

    @Post('promo-slides')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    createPromoSlide(@Body() body: any) {
        return this.banners.createPromoSlide(body);
    }

    @Patch('promo-slides/reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    reorderPromoSlides(@Body() body: { items: { id: string; order: number }[] }) {
        return this.banners.reorderPromoSlides(body.items);
    }

    @Patch('promo-slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    updatePromoSlide(@Param('id') id: string, @Body() body: any) {
        return this.banners.updatePromoSlide(id, body);
    }

    @Delete('promo-slides/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deletePromoSlide(@Param('id') id: string) {
        return this.banners.deletePromoSlide(id);
    }

    @Patch('promo-slides/:id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    togglePromoSlide(@Param('id') id: string) {
        return this.banners.togglePromoSlide(id);
    }

    @Get('promo-slides/presign-image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    presignPromoSlideImage(@Query('filename') filename: string, @Query('contentType') contentType: string) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        return this.banners.presignPromoSlideImage(filename, contentType);
    }

    @Post('promo-slides/:id/image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    uploadPromoSlideImage(@Param('id') id: string, @UploadedFile() file: any, @Body('key') key?: string) {
        if (key) return this.banners.savePromoSlideImageKey(id, key);
        if (file) return this.banners.uploadPromoSlideImage(id, file);
        throw new BadRequestException('Provide a file or a key');
    }

    @Delete('promo-slides/:id/image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    deletePromoSlideImage(@Param('id') id: string) {
        return this.banners.deletePromoSlideImage(id);
    }
}

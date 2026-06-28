import { BadRequestException, Controller, Get, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../common/services/storage.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly storage: StorageService) {}

    // ── Presign (direct browser → Garage upload) ─────────────────────────────

    @Get('presign-image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async presignImage(@Query('filename') filename: string, @Query('contentType') contentType: string) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        const key = this.storage.buildKey('device-images', filename);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    @Get('presign-trade-in-image')
    @UseGuards(JwtAuthGuard)
    async presignTradeInImage(
        @Query('filename') filename: string,
        @Query('contentType') contentType: string,
        @Query('groupId') groupId?: string,
    ) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        const key = this.storage.buildKey('trade-in-images', filename, groupId);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    @Get('presign-repair-image')
    @UseGuards(JwtAuthGuard)
    async presignRepairImage(
        @Query('filename') filename: string,
        @Query('contentType') contentType: string,
        @Query('groupId') groupId?: string,
    ) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        const key = this.storage.buildKey('repair-images', filename, groupId);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    @Get('presign-review-image')
    async presignReviewImage(@Query('filename') filename: string, @Query('contentType') contentType: string) {
        if (!filename || !contentType) throw new BadRequestException('filename and contentType required');
        const key = this.storage.buildKey('review-images', filename);
        const [uploadUrl, viewUrl] = await Promise.all([
            this.storage.presignPut(key, contentType),
            this.storage.generatePresignedUrl(key),
        ]);
        return { uploadUrl, key, viewUrl };
    }

    // ── Legacy multipart (kept for backward compat) ───────────────────────────

    @Post('image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'device-images');
    }

    @Post('trade-in-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadTradeInImage(@UploadedFile() file: any, @Query('groupId') groupId?: string) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'trade-in-images', groupId);
    }

    @Post('repair-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadRepairImage(@UploadedFile() file: any, @Query('groupId') groupId?: string) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'repair-images', groupId);
    }

    @Post('review-image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadReviewImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'review-images');
    }
}

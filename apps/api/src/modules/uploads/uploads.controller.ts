import { BadRequestException, Controller, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StorageService } from '../../common/services/storage.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly storage: StorageService) {}

    // Admin only — product images
    @Post('image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'device-images');
    }

    // Any authenticated user — trade-in device photos
    @Post('trade-in-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadTradeInImage(@UploadedFile() file: any, @Query('groupId') groupId?: string) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'trade-in-images', groupId);
    }

    // Any authenticated user — repair device photos
    @Post('repair-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadRepairImage(@UploadedFile() file: any, @Query('groupId') groupId?: string) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'repair-images', groupId);
    }
}

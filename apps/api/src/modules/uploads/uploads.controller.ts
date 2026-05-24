import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../common/services/storage.service';

@Controller('uploads')
export class UploadsController {
    constructor(private readonly storage: StorageService) {}

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('No file provided');
        return this.storage.uploadFile(file, 'device-images');
    }
}

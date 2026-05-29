import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageProxyController {
  constructor(private readonly storage: StorageService) {}

  @Get(':key(*)')
  async proxy(@Param('key') key: string, @Res() res: Response) {
    try {
      const stream = await this.storage.getObjectStream(key);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      (stream as any).pipe(res);
    } catch {
      throw new NotFoundException('Object not found');
    }
  }
}

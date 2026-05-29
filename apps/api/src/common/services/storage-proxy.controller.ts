import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageProxyController {
  constructor(private readonly storage: StorageService) {}

  @Get('*key')
  async proxy(@Param('key') key: string | string[], @Res() res: Response) {
    const resolvedKey = Array.isArray(key) ? key.join('/') : key;
    try {
      const stream = await this.storage.getObjectStream(resolvedKey);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      (stream as any).pipe(res);
    } catch {
      throw new NotFoundException('Object not found');
    }
  }
}

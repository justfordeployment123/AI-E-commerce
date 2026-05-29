import { Controller, Get, Headers, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageProxyController {
  constructor(private readonly storage: StorageService) {}

  @Get('*key')
  async proxy(
    @Param('key') key: string | string[],
    @Headers('if-none-match') ifNoneMatch: string,
    @Res() res: Response,
  ) {
    const resolvedKey = Array.isArray(key) ? key.join('/') : key;
    try {
      const { stream, contentType, contentLength, etag } = await this.storage.getObject(resolvedKey);

      if (etag && ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (etag) res.setHeader('ETag', etag);

      (stream as any).pipe(res);
    } catch {
      throw new NotFoundException('Object not found');
    }
  }
}

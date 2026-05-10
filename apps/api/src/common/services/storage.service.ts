import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import type Multer from 'multer';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private publicClient: S3Client;
  private bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';

  constructor() {
    const credentials = {
      accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
    };

    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
      credentials,
      forcePathStyle: true,
    });

    // Separate client for presigned URLs so browsers hit the public endpoint,
    // not the internal Docker network address.
    this.publicClient = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.GARAGE_PUBLIC_URL || process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
      credentials,
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file: any,
    folder: string,
  ): Promise<{ filePath: string; presignedUrl: string }> {
    const filename = `${folder}/${uuidv4()}-${file.originalname}`;
    const putCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(putCommand);

    const presignedUrl = await this.generatePresignedUrl(filename);

    return { filePath: filename, presignedUrl };
  }

  // Call this everywhere an image URL needs to be served to a browser.
  // Handles null, raw S3 keys, and old full-URL records safely.
  async resolveImageUrl(filePathOrUrl: string | null | undefined): Promise<string | null> {
    if (!filePathOrUrl) return null;
    try {
      return await this.generatePresignedUrl(filePathOrUrl);
    } catch {
      return null;
    }
  }

  async generatePresignedUrl(filePathOrUrl: string): Promise<string> {
    // Old records stored the full presigned URL — extract just the S3 key.
    let key = filePathOrUrl;
    if (filePathOrUrl.startsWith('http')) {
      const url = new URL(filePathOrUrl);
      // forcePathStyle URL format: /{bucket}/{key}
      key = url.pathname.replace(`/${this.bucketName}/`, '');
    }

    return getSignedUrl(this.publicClient, new GetObjectCommand({ Bucket: this.bucketName, Key: key }), {
      expiresIn: 7 * 24 * 60 * 60,
    });
  }
}

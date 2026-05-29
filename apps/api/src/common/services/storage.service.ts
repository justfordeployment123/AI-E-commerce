import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// All S3 "folders" the app uses. Add a new entry here whenever a new upload
// category is introduced — the bucket + placeholder are created automatically
// on startup in every environment (dev, staging, production).
const FOLDERS = [
  'device-images',
  'trade-in-images',
  'repair-images',
  'review-images',
] as const;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
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

  async onModuleInit() {
    await this.ensureBucketAndFolders();
  }

  // Creates the bucket if missing, then seeds a .keep placeholder inside each
  // folder so the directory structure is visible in the MinIO/Garage console.
  private async ensureBucketAndFolders() {
    // 1. Create bucket if it doesn't exist
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket "${this.bucketName}" already exists`);
    } catch {
      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        this.logger.log(`Bucket "${this.bucketName}" created`);
      } catch (err: any) {
        // BucketAlreadyOwnedByYou is fine — race condition on first boot
        if (err?.Code !== 'BucketAlreadyOwnedByYou') {
          this.logger.error(`Failed to create bucket: ${err?.message}`);
        }
      }
    }

    // 2. Seed a .keep file in each folder so they appear in the console
    for (const folder of FOLDERS) {
      const key = `${folder}/.keep`;
      try {
        await this.s3Client.send(new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: '',
          ContentType: 'application/octet-stream',
        }));
        this.logger.log(`Folder ready: ${folder}/`);
      } catch (err: any) {
        this.logger.warn(`Could not seed folder "${folder}": ${err?.message}`);
      }
    }
  }

  async uploadFile(
    file: any,
    folder: string,
    groupId?: string,
  ): Promise<{ filePath: string; presignedUrl: string }> {
    const prefix = groupId ? `${folder}/${groupId}` : folder;
    const filename = `${prefix}/${uuidv4()}-${file.originalname}`;
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    const presignedUrl = await this.generatePresignedUrl(filename);
    return { filePath: filename, presignedUrl };
  }

  // Call this everywhere an image URL needs to be served to a browser.
  // Handles null, raw S3 keys, old full-URL records, and external URLs safely.
  async resolveImageUrl(filePathOrUrl: string | null | undefined): Promise<string | null> {
    if (!filePathOrUrl) return null;
    // External URLs not hosted on our storage — return them unchanged
    if (filePathOrUrl.startsWith('http')) {
      const endpoint = (process.env.GARAGE_PUBLIC_URL || process.env.GARAGE_ENDPOINT || '').replace(/\/$/, '');
      if (!endpoint || !filePathOrUrl.startsWith(endpoint)) {
        return filePathOrUrl;
      }
    }
    try {
      return await this.generatePresignedUrl(filePathOrUrl);
    } catch {
      return null;
    }
  }

  async deleteFiles(keys: string[]): Promise<void> {
    if (!keys.length) return;
    // S3 DeleteObjects accepts max 1000 keys per request
    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += 1000) chunks.push(keys.slice(i, i + 1000));
    for (const chunk of chunks) {
      try {
        await this.s3Client.send(new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: chunk.map(k => ({ Key: k })), Quiet: true },
        }));
      } catch (err: any) {
        this.logger.warn(`S3 bulk delete partial failure: ${err?.message}`);
      }
    }
  }

  async generatePresignedUrl(filePathOrUrl: string): Promise<string> {
    // Old records stored the full presigned URL — extract just the S3 key.
    let key = filePathOrUrl;
    if (filePathOrUrl.startsWith('http')) {
      const url = new URL(filePathOrUrl);
      key = url.pathname.replace(`/${this.bucketName}/`, '');
    }

    // When a proxy base URL is configured (e.g. https://api.techstopuk.com/storage),
    // return a simple proxy URL instead of a presigned S3 URL so images are
    // always served over HTTPS regardless of the underlying storage endpoint.
    const proxyBase = process.env.GARAGE_PROXY_URL;
    if (proxyBase) {
      return `${proxyBase.replace(/\/$/, '')}/${key}`;
    }

    return getSignedUrl(
      this.publicClient,
      new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
      { expiresIn: 7 * 24 * 60 * 60 },
    );
  }

  async getObject(key: string): Promise<{
    stream: NodeJS.ReadableStream;
    contentType?: string;
    contentLength?: number;
    etag?: string;
  }> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    const response = await this.s3Client.send(command);
    return {
      stream: response.Body as NodeJS.ReadableStream,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
    };
  }
}

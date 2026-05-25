import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';
const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
    credentials: {
        accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
});

async function ensureBucketExists(s3: S3Client, bucket: string): Promise<void> {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
        console.log(`Bucket "${bucket}" not found. Creating...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
}

async function uploadProductImage(
    s3: S3Client,
    bucket: string,
    productSlug: string,
    imageFilename: string,
    downloadsDir: string
): Promise<string> {
    const localPath = path.join(downloadsDir, imageFilename);
    if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
    }
    const s3Key = `products/${productSlug}/${imageFilename}`;
    const buffer = fs.readFileSync(localPath);
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: 'image/jpeg',
    }));
    return s3Key;
}

async function main() {
    const downloadsDir = path.join(__dirname, 'downloads');
    const productsJsonPath = path.join(downloadsDir, 'products.json');

    if (!fs.existsSync(productsJsonPath)) {
        throw new Error(`products.json not found at ${productsJsonPath}`);
    }

    const productsData: any[] = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
    console.log(`Loaded ${productsData.length} products from products.json`);

    await ensureBucketExists(s3Client, bucketName);

    await prisma.product.deleteMany({});
    console.log('Cleared existing products');

    let success = 0;
    for (const prod of productsData) {
        const s3Keys: string[] = [];

        if (Array.isArray(prod.images)) {
            for (const imgFilename of prod.images) {
                try {
                    const key = await uploadProductImage(s3Client, bucketName, prod.slug, imgFilename, downloadsDir);
                    s3Keys.push(key);
                } catch (e: any) {
                    console.error(`  Image upload failed "${prod.name}" / "${imgFilename}": ${e.message}`);
                }
            }
        }

        try {
            await prisma.product.create({
                data: {
                    name: prod.name,
                    slug: prod.slug,
                    category: prod.category === 'Laptops / MacBooks' ? 'Laptops' : prod.category,
                    brand: prod.brand,
                    model: prod.model,
                    condition: prod.condition,
                    price: Number(prod.price),
                    comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                    stock: Number(prod.stock ?? 0),
                    images: s3Keys,
                    specs: prod.specs ?? {},
                    description: prod.description ?? '',
                    rating: Number(prod.rating ?? 0),
                    reviewCount: Number(prod.reviewCount ?? 0),
                    isActive: prod.isActive !== undefined ? Boolean(prod.isActive) : true,
                },
            });
            success++;
            if (success % 10 === 0 || success === productsData.length) {
                console.log(`  ${success}/${productsData.length} products seeded`);
            }
        } catch (e: any) {
            console.error(`  Failed to insert "${prod.name}": ${e.message}`);
        }
    }

    console.log(`\nDone — ${success}/${productsData.length} products seeded with images.`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

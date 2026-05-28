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

function normalizeCategory(raw: string): string {
    if (raw === 'Laptops / MacBooks') return 'Laptops';
    return raw;
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

    // Clear existing data
    await prisma.product.deleteMany({});
    await prisma.deviceCatalog.deleteMany({});
    console.log('Cleared existing products and device catalog');

    // ── Step 1: Build unique device catalog from products data ────────────────
    const catalogMap = new Map<string, { brand: string; model: string; category: string; storageOptions: Set<string> }>();

    for (const prod of productsData) {
        const brand = prod.brand as string;
        const model = prod.model as string;
        const category = normalizeCategory(prod.category as string);
        const storage = (prod.specs?.Storage || prod.specs?.storage || '') as string;
        const key = `${brand}::${model}`;

        if (!catalogMap.has(key)) {
            catalogMap.set(key, { brand, model, category, storageOptions: new Set() });
        }
        if (storage) catalogMap.get(key)!.storageOptions.add(storage);
    }

    const catalogIdByKey = new Map<string, string>();
    for (const [key, data] of catalogMap.entries()) {
        const entry = await prisma.deviceCatalog.create({
            data: {
                brand: data.brand,
                model: data.model,
                category: data.category,
                storageOptions: Array.from(data.storageOptions),
            },
        });
        catalogIdByKey.set(key, entry.id);
    }
    console.log(`Created ${catalogMap.size} device catalog entries`);

    // ── Step 2: Seed products with catalogId ──────────────────────────────────
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

        const catalogKey = `${prod.brand}::${prod.model}`;
        const catalogId = catalogIdByKey.get(catalogKey);
        if (!catalogId) {
            console.error(`  No catalog entry for "${prod.brand} ${prod.model}" — skipping`);
            continue;
        }

        const storage = (prod.specs?.Storage || prod.specs?.storage || '') as string;
        // Remove storage from specs since it's now a dedicated column
        const { Storage: _S, storage: _s, ...remainingSpecs } = prod.specs ?? {};

        try {
            await prisma.product.create({
                data: {
                    catalogId,
                    name: prod.name,
                    slug: prod.slug,
                    condition: prod.condition,
                    storage,
                    price: Number(prod.price),
                    comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                    stock: Number(prod.stock ?? 0),
                    images: s3Keys,
                    specs: remainingSpecs ?? {},
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

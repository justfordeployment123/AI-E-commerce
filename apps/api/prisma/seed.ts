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

const defaultPricingConfigs = [
    { key: 'margin_pct', value: 30.0, label: 'Default Profit Margin (%)' },
    { key: 'multiplier_mint', value: 1.0, label: 'Mint Condition Multiplier' },
    { key: 'multiplier_good', value: 0.85, label: 'Good Condition Multiplier' },
    { key: 'multiplier_used', value: 0.70, label: 'Used Condition Multiplier' },
    { key: 'multiplier_damaged', value: 0.40, label: 'Damaged Condition Multiplier' },
];

const devices = [
    // --- iPhones ---
    { brand: 'Apple', model: 'iPhone 11', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro', category: 'Phone', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro Max', category: 'Phone', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Mini', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Mini', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Plus', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Plus', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },

    // --- Samsung Galaxy ---
    { brand: 'Samsung', model: 'Galaxy S21 5G', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21+ 5G', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21 Ultra 5G', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S22', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22+', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S23', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23+', category: 'Phone', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S24', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24+', category: 'Phone', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },

    // --- iPads ---
    { brand: 'Apple', model: 'iPad 9th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad 10th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Air 5th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Mini 6th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M1', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M2', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M1', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M2', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },

    // --- PlayStations ---
    { brand: 'Sony', model: 'PlayStation 3 Slim', category: 'Console', storageOptions: ['120GB', '250GB', '320GB', '500GB'] },
    { brand: 'Sony', model: 'PlayStation 4', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Slim', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Pro', category: 'Console', storageOptions: ['1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Disc Edition', category: 'Console', storageOptions: ['825GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Digital Edition', category: 'Console', storageOptions: ['825GB', '1TB'] },

    // --- Xboxes ---
    { brand: 'Microsoft', model: 'Xbox 360 Slim', category: 'Console', storageOptions: ['4GB', '250GB', '320GB'] },
    { brand: 'Microsoft', model: 'Xbox One', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox One S', category: 'Console', storageOptions: ['500GB', '1TB', '2TB'] },
    { brand: 'Microsoft', model: 'Xbox One X', category: 'Console', storageOptions: ['1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series S', category: 'Console', storageOptions: ['512GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series X', category: 'Console', storageOptions: ['1TB'] },

    // --- MacBooks ---
    { brand: 'Apple', model: 'MacBook Air M1 (2020)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'MacBook Air M2 (2022)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 13-inch M1 (2020)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 14-inch M2 Pro (2023)', category: 'Laptop', storageOptions: ['512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 16-inch M3 Max (2023)', category: 'Laptop', storageOptions: ['1TB', '2TB', '4TB'] },
];

const accessories = [
    { brand: 'Apple', model: '20W USB-C Power Adapter', name: 'Apple 20W USB-C Power Adapter', price: 19 },
    { brand: 'Apple', model: 'MagSafe Charger', name: 'Apple MagSafe Charger', price: 39 },
    { brand: 'Sony', model: 'DualSense Wireless Controller', name: 'Sony DualSense Wireless Controller (PS5)', price: 59 },
    { brand: 'Microsoft', model: 'Xbox Wireless Controller', name: 'Microsoft Xbox Wireless Controller', price: 54 },
    { brand: 'Apple', model: 'Pencil 2nd Gen', name: 'Apple Pencil (2nd Generation)', price: 99 },
];

// Ensure bucket exists in S3
async function ensureBucketExists(s3: S3Client, bucket: string): Promise<void> {
    try {
        console.log(`Checking S3 bucket "${bucket}"...`);
        await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err) {
        console.log(`Bucket "${bucket}" not found. Creating bucket...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
}

// Upload a single product image to S3 in the format products/{productSlug}/{imageFilename}
async function uploadProductImage(
    s3: S3Client,
    bucket: string,
    productSlug: string,
    imageFilename: string,
    downloadsDir: string
): Promise<string> {
    const localPath = path.join(downloadsDir, imageFilename);
    const destS3Key = `products/${productSlug}/${imageFilename}`;
    
    if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found for upload: ${localPath}`);
    }

    const fileBuffer = fs.readFileSync(localPath);
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: destS3Key,
        Body: fileBuffer,
        ContentType: 'image/jpeg',
    }));

    return destS3Key;
}

// Seed pricing configurations
async function seedPricingConfigs(prismaClient: PrismaClient, configs: typeof defaultPricingConfigs): Promise<void> {
    console.log('Seeding pricing configurations...');
    await prismaClient.pricingConfig.deleteMany({});
    for (const config of configs) {
        await prismaClient.pricingConfig.create({
            data: config,
        });
    }
    console.log(`Seeded ${configs.length} pricing configurations.`);
}

// Seed device catalog
async function seedDeviceCatalog(prismaClient: PrismaClient, devicesList: typeof devices): Promise<void> {
    console.log('Seeding device catalog...');
    await prismaClient.deviceCatalog.deleteMany({});
    const catMap: Record<string, string> = {
        'Phone': 'phones',
        'Tablet': 'tablets',
        'Console': 'consoles',
        'Laptop': 'laptops',
        'Accessories': 'accessories',
    };
    for (const dev of devicesList) {
        const category = catMap[dev.category] || dev.category.toLowerCase();
        await prismaClient.deviceCatalog.create({
            data: {
                brand: dev.brand,
                model: dev.model,
                category,
                storageOptions: dev.storageOptions,
                isActive: true,
            },
        });
    }
    console.log(`Seeded ${devicesList.length} devices in the trade-in catalog.`);
}

// Seed products from products.json and upload already downloaded images to S3
async function seedProducts(
    prismaClient: PrismaClient,
    s3: S3Client,
    bucket: string,
    productsData: any[],
    downloadsDir: string
): Promise<number> {
    console.log('Seeding products and uploading images to S3...');
    await prismaClient.product.deleteMany({});
    
    let successCount = 0;
    for (let i = 0; i < productsData.length; i++) {
        const prod = productsData[i];
        const s3Keys: string[] = [];

        if (prod.images && Array.isArray(prod.images)) {
            for (const imgFilename of prod.images) {
                try {
                    const s3Key = await uploadProductImage(s3, bucket, prod.slug, imgFilename, downloadsDir);
                    s3Keys.push(s3Key);
                } catch (e: any) {
                    console.error(`[ERROR] Image upload failed for product "${prod.name}" and image "${imgFilename}":`, e.message);
                }
            }
        }

        try {
            await prismaClient.product.create({
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
                    specs: prod.specs || {},
                    description: prod.description || '',
                    rating: prod.rating !== undefined ? Number(prod.rating) : 0.0,
                    reviewCount: prod.reviewCount !== undefined ? Number(prod.reviewCount) : 0,
                    isActive: prod.isActive !== undefined ? Boolean(prod.isActive) : true,
                }
            });
            successCount++;
            if (successCount % 10 === 0 || successCount === productsData.length) {
                console.log(`Seeded ${successCount}/${productsData.length} products...`);
            }
        } catch (e: any) {
            console.error(`[ERROR] Failed to insert product "${prod.name}" into database:`, e);
        }
    }
    
    return successCount;
}

async function main() {
    console.log('Starting modular database and S3 seeding...');

    // 1. Resolve downloads path and verify products.json exists
    const downloadsDir = path.join(__dirname, 'downloads');
    const productsJsonPath = path.join(downloadsDir, 'products.json');
    if (!fs.existsSync(productsJsonPath)) {
        throw new Error(`Required file 'products.json' not found in downloads folder: ${productsJsonPath}`);
    }

    const productsData = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
    console.log(`Loaded ${productsData.length} products from products.json.`);

    // 2. Ensure MinIO/Garage Bucket Exists
    await ensureBucketExists(s3Client, bucketName);

    // 3. Seed configurations and devices
    await seedPricingConfigs(prisma, defaultPricingConfigs);
    await seedDeviceCatalog(prisma, devices);

    // 4. Seed products and upload images
    const seededCount = await seedProducts(prisma, s3Client, bucketName, productsData, downloadsDir);

    console.log(`\nSeeding completed successfully!`);
    console.log(`- Seeded ${defaultPricingConfigs.length} pricing configurations.`);
    console.log(`- Seeded ${devices.length} devices in the trade-in catalog.`);
    console.log(`- Seeded ${seededCount} out of ${productsData.length} products.`);
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

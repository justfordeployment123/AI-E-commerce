import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const PRICING_DEFAULTS = [
    { key: 'margin_pct', value: 30.0, label: 'Default Profit Margin (%)' },
    { key: 'multiplier_mint', value: 1.0, label: 'Mint Condition Multiplier' },
    { key: 'multiplier_good', value: 0.85, label: 'Good Condition Multiplier' },
    { key: 'multiplier_used', value: 0.70, label: 'Used Condition Multiplier' },
    { key: 'multiplier_damaged', value: 0.40, label: 'Damaged Condition Multiplier' },
];

const DEVICE_CATALOG = [
    { brand: 'Apple', model: 'iPhone 11', category: 'phones', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro', category: 'phones', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro Max', category: 'phones', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12', category: 'phones', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Mini', category: 'phones', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro Max', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Mini', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Plus', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Plus', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'phones', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S21 5G', category: 'phones', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21+ 5G', category: 'phones', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21 Ultra 5G', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S22', category: 'phones', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22+', category: 'phones', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', category: 'phones', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S23', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23+', category: 'phones', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: 'phones', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S24', category: 'phones', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24+', category: 'phones', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'phones', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPad 9th Gen', category: 'tablets', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad 10th Gen', category: 'tablets', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Air 5th Gen', category: 'tablets', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Mini 6th Gen', category: 'tablets', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M1', category: 'tablets', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M2', category: 'tablets', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M1', category: 'tablets', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M2', category: 'tablets', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Sony', model: 'PlayStation 3 Slim', category: 'consoles', storageOptions: ['120GB', '250GB', '320GB', '500GB'] },
    { brand: 'Sony', model: 'PlayStation 4', category: 'consoles', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Slim', category: 'consoles', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Pro', category: 'consoles', storageOptions: ['1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Disc Edition', category: 'consoles', storageOptions: ['825GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Digital Edition', category: 'consoles', storageOptions: ['825GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox 360 Slim', category: 'consoles', storageOptions: ['4GB', '250GB', '320GB'] },
    { brand: 'Microsoft', model: 'Xbox One', category: 'consoles', storageOptions: ['500GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox One S', category: 'consoles', storageOptions: ['500GB', '1TB', '2TB'] },
    { brand: 'Microsoft', model: 'Xbox One X', category: 'consoles', storageOptions: ['1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series S', category: 'consoles', storageOptions: ['512GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series X', category: 'consoles', storageOptions: ['1TB'] },
    { brand: 'Apple', model: 'MacBook Air M1 (2020)', category: 'laptops', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'MacBook Air M2 (2022)', category: 'laptops', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 13-inch M1 (2020)', category: 'laptops', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 14-inch M2 Pro (2023)', category: 'laptops', storageOptions: ['512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 16-inch M3 Max (2023)', category: 'laptops', storageOptions: ['1TB', '2TB', '4TB'] },
];

export interface SeedResult {
    pricingConfigs: number;
    deviceCatalog: number;
    products: {
        created: number;
        updated: number;
        errors: string[];
        total: number;
    };
}

@Injectable()
export class SeedService {
    private readonly logger = new Logger(SeedService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly downloadsDir: string;

    constructor(private readonly prisma: PrismaService) {
        this.bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';
        this.s3Client = new S3Client({
            region: 'us-east-1',
            endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
            credentials: {
                accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
                secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
            },
            forcePathStyle: true,
        });
        this.downloadsDir = path.join(process.cwd(), 'prisma', 'downloads');
    }

    async runSeed(): Promise<SeedResult> {
        const productsJsonPath = path.join(this.downloadsDir, 'products.json');
        if (!fs.existsSync(productsJsonPath)) {
            throw new Error(`products.json not found at ${productsJsonPath}. Make sure the image/data files are bundled in the container.`);
        }

        const productsData: any[] = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
        this.logger.log(`Loaded ${productsData.length} products from products.json`);

        const pricingCount = await this.seedPricingConfigs();
        const deviceCount = await this.seedDeviceCatalog();
        const productsResult = await this.seedProducts(productsData);

        return { pricingConfigs: pricingCount, deviceCatalog: deviceCount, products: productsResult };
    }

    private async seedPricingConfigs(): Promise<number> {
        for (const config of PRICING_DEFAULTS) {
            await this.prisma.pricingConfig.upsert({
                where: { key: config.key },
                update: { value: config.value, label: config.label },
                create: config,
            });
        }
        this.logger.log(`Seeded ${PRICING_DEFAULTS.length} pricing configs`);
        return PRICING_DEFAULTS.length;
    }

    private async seedDeviceCatalog(): Promise<number> {
        await this.prisma.deviceCatalog.deleteMany({});
        for (const dev of DEVICE_CATALOG) {
            await this.prisma.deviceCatalog.create({
                data: { brand: dev.brand, model: dev.model, category: dev.category, storageOptions: dev.storageOptions, isActive: true },
            });
        }
        this.logger.log(`Seeded ${DEVICE_CATALOG.length} devices in trade-in catalog`);
        return DEVICE_CATALOG.length;
    }

    private async uploadImage(productSlug: string, imageFilename: string): Promise<string> {
        const localPath = path.join(this.downloadsDir, imageFilename);
        if (!fs.existsSync(localPath)) {
            throw new Error(`Image file not found: ${localPath}`);
        }
        const s3Key = `products/${productSlug}/${imageFilename}`;
        const buffer = fs.readFileSync(localPath);
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: 'image/jpeg',
        }));
        return s3Key;
    }

    private async seedProducts(productsData: any[]): Promise<SeedResult['products']> {
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (let i = 0; i < productsData.length; i++) {
            const prod = productsData[i];
            try {
                const slug = prod.slug as string;
                const s3Keys: string[] = [];

                if (Array.isArray(prod.images)) {
                    for (const imgFilename of prod.images as string[]) {
                        try {
                            const key = await this.uploadImage(slug, imgFilename);
                            s3Keys.push(key);
                        } catch (e: any) {
                            this.logger.warn(`Image upload skipped for "${prod.name}" / "${imgFilename}": ${e.message}`);
                        }
                    }
                }

                const data = {
                    name: prod.name,
                    slug,
                    category: prod.category === 'Laptops / MacBooks' ? 'Laptops' : prod.category,
                    brand: prod.brand,
                    model: prod.model,
                    condition: prod.condition,
                    price: Number(prod.price),
                    comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                    stock: Number(prod.stock ?? 10),
                    images: s3Keys.length > 0 ? s3Keys : (Array.isArray(prod.images) ? prod.images : []),
                    specs: prod.specs ?? {},
                    description: prod.description ?? '',
                    rating: Number(prod.rating ?? 0),
                    reviewCount: Number(prod.reviewCount ?? 0),
                    isActive: prod.isActive !== undefined ? Boolean(prod.isActive) : true,
                } as never;

                const existing = await this.prisma.product.findUnique({ where: { slug } });
                if (existing) {
                    await this.prisma.product.update({ where: { slug }, data });
                    updated++;
                } else {
                    await this.prisma.product.create({ data });
                    created++;
                }

                if ((created + updated) % 10 === 0) {
                    this.logger.log(`Progress: ${created + updated}/${productsData.length} products processed`);
                }
            } catch (e: any) {
                errors.push(`${prod.name ?? prod.slug}: ${e.message}`);
                this.logger.error(`Failed to seed "${prod.name}": ${e.message}`);
            }
        }

        this.logger.log(`Products seeded — created: ${created}, updated: ${updated}, errors: ${errors.length}`);
        return { created, updated, errors, total: productsData.length };
    }
}

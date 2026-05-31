import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// All paths relative to prisma/seed/
const CATEGORY_IMAGES: Record<string, string> = {
    phones:      'categories/phones.png',
    tablets:     'categories/tablets.png',
    laptops:     'categories/laptops.png',
    consoles:    'categories/consoles.png',
    audio:       'categories/audio.png',
    accessories: 'categories/audio.png',
};

const BRAND_CATEGORY_IMAGES: Record<string, Record<string, string[]>> = {
    phones: {
        apple:   ['brands/phones/apple/showcase_iphone.png', 'brands/phones/apple/iphone_15.png', 'brands/phones/apple/refurbished_iphone.png'],
        samsung: ['brands/phones/samsung/showcase_galaxy_s24.png', 'brands/phones/samsung/samsung_galaxy.png', 'brands/phones/samsung/bento_smartphones.png'],
        google:  ['brands/phones/google/pixel_1.png', 'brands/phones/google/pixel_2.png', 'brands/phones/google/pixel_3.png'],
        oneplus: ['brands/phones/oneplus/oneplus_1.png', 'brands/phones/oneplus/oneplus_2.png', 'brands/phones/oneplus/oneplus_3.png'],
    },
    tablets: {
        apple: ['brands/tablets/apple/ipad_pro_1.png', 'brands/tablets/apple/ipad_pro_2.png', 'brands/tablets/apple/ipad_pro_3.png'],
    },
    laptops: {
        apple: ['brands/laptops/apple/showcase_macbook.png', 'brands/laptops/apple/macbook_pro.png', 'brands/laptops/apple/laptop_1.png', 'brands/laptops/apple/laptop_2.png'],
    },
    consoles: {
        sony:      ['brands/consoles/sony/showcase_ps5.png', 'brands/consoles/sony/console_1.png', 'brands/consoles/sony/console_2.png'],
        microsoft: ['brands/consoles/microsoft/microsoft-xbox-360-slim.jpg'],
    },
    audio: {
        apple: ['brands/audio/apple/showcase_airpods_max.png', 'brands/audio/apple/showcase_airpods_pro.png'],
        sony:  ['brands/audio/sony/showcase_sony_wh1000xm5.png', 'brands/audio/sony/audio_1.png', 'brands/audio/sony/audio_2.png'],
    },
};

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
    banners: number;
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
    private readonly webPublicDir: string;
    private readonly seedLogosDir: string;

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
        this.downloadsDir  = path.join(process.cwd(), 'prisma', 'seed', 'products');
        this.webPublicDir  = path.join(process.cwd(), 'prisma', 'seed');
        this.seedLogosDir  = path.join(process.cwd(), 'prisma', 'seed', 'brands', 'logos');
    }

    // Upload any local file to S3 at the given key. Returns key or null if file missing.
    private async uploadLocalFile(localPath: string, s3Key: string): Promise<string | null> {
        if (!fs.existsSync(localPath)) return null;
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                   : ext === '.png' ? 'image/png'
                   : ext === '.webp' ? 'image/webp'
                   : 'application/octet-stream';
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key:    s3Key,
            Body:   buffer,
            ContentType: mime,
        }));
        return s3Key;
    }

    async runSeed(): Promise<SeedResult> {
        const productsJsonPath = path.join(this.downloadsDir, 'products.json');
        if (!fs.existsSync(productsJsonPath)) {
            throw new Error(`products.json not found at ${productsJsonPath}. Run: cp prisma/downloads/* prisma/seed/products/`);
        }

        const productsData: any[] = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
        this.logger.log(`Loaded ${productsData.length} products from products.json`);

        const pricingCount = await this.seedPricingConfigs();
        const bannerCount  = await this.seedBanners();
        const deviceCount  = await this.seedDeviceCatalog();
        const productsResult = await this.seedProducts(productsData);

        return { pricingConfigs: pricingCount, banners: bannerCount, deviceCatalog: deviceCount, products: productsResult };
    }

    private async seedPricingConfigs(): Promise<number> {
        for (const config of PRICING_DEFAULTS) {
            await this.prisma.pricingConfig.upsert({
                where: { key: config.key },
                update: { value: config.value, label: config.label },
                create: config,
            });
        }
        return PRICING_DEFAULTS.length;
    }

    private async seedDeviceCatalog(): Promise<number> {
        await this.prisma.orderItem.deleteMany({});
        await this.prisma.product.deleteMany({});
        await this.prisma.deviceCatalog.deleteMany({});

        const brandCache    = new Map<string, string>();
        const categoryCache = new Map<string, string>();
        const bcCache       = new Map<string, string>();

        const findOrCreateBrand = async (name: string) => {
            if (brandCache.has(name)) return brandCache.get(name)!;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const existing = await this.prisma.brand.findUnique({ where: { slug } });
            let brand = existing ?? await this.prisma.brand.create({ data: { name, slug } });

            // Upload logo if not already set and the file exists
            if (!brand.logo) {
                const logoPath = path.join(this.seedLogosDir, `${slug}.png`);
                const s3Key = `catalog/brands/${slug}/${slug}.png`;
                const uploaded = await this.uploadLocalFile(logoPath, s3Key);
                if (uploaded) {
                    brand = await this.prisma.brand.update({ where: { id: brand.id }, data: { logo: uploaded } });
                    this.logger.log(`  Logo uploaded for brand: ${name}`);
                }
            }

            brandCache.set(name, brand.id);
            return brand.id;
        };

        const findOrCreateCategory = async (slug: string) => {
            if (categoryCache.has(slug)) return categoryCache.get(slug)!;
            const name = slug.charAt(0).toUpperCase() + slug.slice(1);
            const existing = await this.prisma.category.findUnique({ where: { slug } });
            let cat = existing ?? await this.prisma.category.create({ data: { name, slug } });

            // Upload category image if not already set
            if (!cat.image && CATEGORY_IMAGES[slug]) {
                const imgPath = path.join(this.webPublicDir, CATEGORY_IMAGES[slug]);
                const ext = path.extname(CATEGORY_IMAGES[slug]);
                const s3Key = `catalog/categories/${slug}/${slug}${ext}`;
                const uploaded = await this.uploadLocalFile(imgPath, s3Key);
                if (uploaded) {
                    cat = await this.prisma.category.update({ where: { id: cat.id }, data: { image: uploaded } });
                    this.logger.log(`  Image uploaded for category: ${slug}`);
                }
            }

            categoryCache.set(slug, cat.id);
            return cat.id;
        };

        const findOrCreateBrandCategory = async (brandId: string, brandSlug: string, categoryId: string, categorySlug: string) => {
            const key = `${brandId}::${categoryId}`;
            if (bcCache.has(key)) return bcCache.get(key)!;

            const existing = await this.prisma.brandCategory.findUnique({
                where: { brandId_categoryId: { brandId, categoryId } },
            });
            let bc = existing ?? await this.prisma.brandCategory.create({ data: { brandId, categoryId } });

            // Upload showcase images if not already seeded
            const existingImages = (bc.images as string[]) ?? [];
            if (existingImages.length === 0) {
                const srcImages = BRAND_CATEGORY_IMAGES[categorySlug]?.[brandSlug] ?? [];
                const uploadedKeys: string[] = [];
                for (const relPath of srcImages) {
                    const localPath = path.join(this.webPublicDir, relPath);
                    const filename = path.basename(relPath);
                    const s3Key = `catalog/${categorySlug}/${brandSlug}/${filename}`;
                    const uploaded = await this.uploadLocalFile(localPath, s3Key);
                    if (uploaded) uploadedKeys.push(uploaded);
                }
                if (uploadedKeys.length > 0) {
                    bc = await this.prisma.brandCategory.update({
                        where: { id: bc.id },
                        data: { images: uploadedKeys },
                    });
                    this.logger.log(`  ${uploadedKeys.length} images uploaded for ${brandSlug}/${categorySlug}`);
                }
            }

            bcCache.set(key, bc.id);
            return bc.id;
        };

        for (const dev of DEVICE_CATALOG) {
            const brandSlug    = dev.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const categorySlug = dev.category;
            const brandId      = await findOrCreateBrand(dev.brand);
            const categoryId   = await findOrCreateCategory(categorySlug);
            const brandCategoryId = await findOrCreateBrandCategory(brandId, brandSlug, categoryId, categorySlug);
            await this.prisma.deviceCatalog.create({
                data: { brandCategoryId, model: dev.model, storageOptions: dev.storageOptions, isActive: true },
            });
        }
        this.logger.log(`Seeded ${DEVICE_CATALOG.length} device catalog entries`);
        return DEVICE_CATALOG.length;
    }

    private async seedBanners(): Promise<number> {
        const bannersDir = path.join(process.cwd(), 'prisma', 'seed', 'banners');
        if (!fs.existsSync(bannersDir)) {
            this.logger.warn('banners/ directory not found in web/public — skipping banner seed');
            return 0;
        }

        const files = fs.readdirSync(bannersDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        let count = 0;

        for (let i = 0; i < files.length; i++) {
            const filename = files[i]!;
            const localPath = path.join(bannersDir, filename);
            const s3Key = `banners/${filename}`;

            const existing = await this.prisma.banner.findUnique({ where: { key: s3Key } });
            if (!existing) {
                const uploaded = await this.uploadLocalFile(localPath, s3Key);
                if (uploaded) {
                    await this.prisma.banner.create({
                        data: { key: uploaded, label: filename.replace(/\.[^.]+$/, ''), order: i },
                    });
                    count++;
                    this.logger.log(`  Banner uploaded: ${filename}`);
                }
            }
        }

        this.logger.log(`Seeded ${count} banners`);
        return count;
    }

    private async uploadImage(productSlug: string, imageFilename: string): Promise<string> {
        const localPath = path.join(this.downloadsDir, imageFilename);
        if (!fs.existsSync(localPath)) throw new Error(`Image file not found: ${localPath}`);
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

    private normalizeCategory(raw: string): string {
        const map: Record<string, string> = {
            'phones': 'phones', 'tablets': 'tablets',
            'consoles': 'consoles', 'laptops': 'laptops',
            'accessories': 'accessories',
            'laptops / macbooks': 'laptops',
        };
        return map[raw.toLowerCase()] ?? raw.toLowerCase();
    }

    private async seedProducts(productsData: any[]): Promise<SeedResult['products']> {
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        // Build brand::model → catalogId lookup from what was just seeded
        const catalogEntries = await this.prisma.deviceCatalog.findMany({
            select: { id: true, model: true, brandCategory: { include: { brand: true } } },
        });
        const catalogMap = new Map<string, string>(
            catalogEntries.map(e => [`${e.brandCategory.brand.name}::${e.model}`, e.id]),
        );

        for (const prod of productsData) {
            try {
                const brand = prod.brand as string;
                const model = prod.model as string;

                // Auto-create catalog entry if this brand/model isn't in the hardcoded list
                let catalogId = catalogMap.get(`${brand}::${model}`);
                if (!catalogId) {
                    const storage = (prod.specs?.Storage || prod.specs?.storage || '') as string;
                    const categorySlug = this.normalizeCategory(prod.category ?? 'phones');
                    const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                    const brandRecord = await this.prisma.brand.upsert({
                        where: { slug: brandSlug },
                        update: {},
                        create: { name: brand, slug: brandSlug },
                    });
                    const catName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
                    const catRecord = await this.prisma.category.upsert({
                        where: { slug: categorySlug },
                        update: {},
                        create: { name: catName, slug: categorySlug },
                    });
                    const bc = await this.prisma.brandCategory.upsert({
                        where: { brandId_categoryId: { brandId: brandRecord.id, categoryId: catRecord.id } },
                        update: {},
                        create: { brandId: brandRecord.id, categoryId: catRecord.id },
                    });

                    const entry = await this.prisma.deviceCatalog.upsert({
                        where: { brandCategoryId_model: { brandCategoryId: bc.id, model } },
                        update: {},
                        create: {
                            brandCategoryId: bc.id,
                            model,
                            storageOptions: storage ? [storage] : [],
                            isActive: true,
                        },
                    });
                    catalogId = entry.id;
                    catalogMap.set(`${brand}::${model}`, catalogId);
                }

                const slug = prod.slug as string;
                const storage = (prod.specs?.Storage || prod.specs?.storage || '') as string;
                const { Storage: _S, storage: _s, ...remainingSpecs } = prod.specs ?? {};

                const s3Keys: string[] = [];
                if (Array.isArray(prod.images)) {
                    for (const imgFilename of prod.images as string[]) {
                        try {
                            s3Keys.push(await this.uploadImage(slug, imgFilename));
                        } catch (e: any) {
                            this.logger.warn(`Image skipped "${prod.name}" / "${imgFilename}": ${e.message}`);
                        }
                    }
                }

                const data = {
                    catalogId,
                    name: prod.name,
                    slug,
                    condition: prod.condition,
                    storage,
                    price: Number(prod.price),
                    comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                    stock: Number(prod.stock ?? 10),
                    images: s3Keys.length > 0 ? s3Keys : (Array.isArray(prod.images) ? prod.images : []),
                    specs: remainingSpecs ?? {},
                    description: prod.description ?? '',
                    rating: Number(prod.rating ?? 0),
                    reviewCount: Number(prod.reviewCount ?? 0),
                    isActive: prod.isActive !== undefined ? Boolean(prod.isActive) : true,
                };

                const existing = await this.prisma.product.findUnique({ where: { slug } });
                if (existing) {
                    await this.prisma.product.update({ where: { slug }, data: data as never });
                    updated++;
                } else {
                    await this.prisma.product.create({ data: data as never });
                    created++;
                }

                if ((created + updated) % 10 === 0) {
                    this.logger.log(`Progress: ${created + updated}/${productsData.length}`);
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

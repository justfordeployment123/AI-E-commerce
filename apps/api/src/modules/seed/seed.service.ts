import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * "apple[iphone]" → { slug: "apple", alias: "iphone" }
 * "samsung"       → { slug: "samsung", alias: null }
 * slug  = DB brand identity
 * alias = display name within this category (e.g. "iPhone", "Xbox")
 */
function parseBrandFolderName(folderName: string): { slug: string; alias: string | null } {
    const match = folderName.match(/^([^\[]+)(?:\[([^\]]+)\])?$/);
    const slug  = (match?.[1] ?? folderName).trim().toLowerCase();
    const raw   = match?.[2]?.trim().toLowerCase() ?? null;
    return { slug, alias: raw && raw !== slug ? raw : null };
}

function isImageFile(name: string): boolean {
    return /\.(jpg|jpeg|png|webp)$/i.test(name);
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Per-slug flags: which categories support trade-in selling and/or repair
const CATEGORY_FLAGS: Record<string, { isSellable: boolean; isRepairable: boolean }> = {
    phones:      { isSellable: true,  isRepairable: true  },
    tablets:     { isSellable: true,  isRepairable: true  },
    consoles:    { isSellable: true,  isRepairable: true  },
    laptops:     { isSellable: true,  isRepairable: true  },
    audio:       { isSellable: true,  isRepairable: false },
    smartwatches:{ isSellable: true,  isRepairable: false },
};
function categoryFlags(slug: string) {
    return CATEGORY_FLAGS[slug] ?? { isSellable: false, isRepairable: false };
}

const PRICING_DEFAULTS = [
    { key: 'margin_pct', value: 30.0, label: 'Default Profit Margin (%)' },
    { key: 'multiplier_mint', value: 1.0, label: 'Mint Condition Multiplier' },
    { key: 'multiplier_good', value: 0.85, label: 'Good Condition Multiplier' },
    { key: 'multiplier_used', value: 0.70, label: 'Used Condition Multiplier' },
    { key: 'multiplier_damaged', value: 0.40, label: 'Damaged Condition Multiplier' },
    { key: 'show_unpriced_products', value: 0, label: 'Show unpriced products on storefront (0=hide, 1=show)' },
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
    promoSlides: number;
    deviceCatalog: number;
    others: number;
    categories: number;
    brands: number;
    brandCategories: number;
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
    private readonly seedDir: string;

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
        this.downloadsDir = path.join(process.cwd(), 'prisma', 'seed', 'products');
        this.seedDir      = path.join(process.cwd(), 'prisma', 'seed');
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
            throw new Error(`products.json not found at ${productsJsonPath}.`);
        }

        const productsData: any[] = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
        this.logger.log(`Loaded ${productsData.length} products from products.json`);

        const pricingCount   = await this.seedPricingConfigs();
        const bannerCount    = await this.seedBanners();
        const slideCount     = await this.seedPromoSlides();
        const deviceCount    = await this.seedCatalogFromFolder();
        const productsResult = await this.seedProducts(productsData);
        const othersCount    = await this.seedOthers();

        const categoryCount      = await this.prisma.category.count();
        const brandCount         = await this.prisma.brand.count();
        const brandCategoryCount = await this.prisma.brandCategory.count();

        return { 
            pricingConfigs: pricingCount, 
            banners: bannerCount, 
            promoSlides: slideCount, 
            deviceCatalog: deviceCount, 
            others: othersCount, 
            products: productsResult,
            categories: categoryCount,
            brands: brandCount,
            brandCategories: brandCategoryCount,
        };
    }

    // ─── Purge: wipe all catalog + product data from DB and Garage ───────────
    async purgeAll(): Promise<{
        deleted: number;
        counts: {
            orderItems: number;
            reviews: number;
            scraperRuns: number;
            scrapedPrices: number;
            products: number;
            otherBrands: number;
            otherSubcategories: number;
            deviceCatalog: number;
            brandCategories: number;
            categories: number;
            brands: number;
            banners: number;
            promoSlides: number;
            pricingConfigs: number;
        }
    }> {
        // 1. Collect all S3 keys stored in the DB
        const [products, brandCats, categories, brands, banners, promoSlides] = await Promise.all([
            this.prisma.product.findMany({ select: { images: true } }),
            this.prisma.brandCategory.findMany({ select: { images: true } }),
            this.prisma.category.findMany({ select: { image: true } }),
            this.prisma.brand.findMany({ select: { logo: true } }),
            this.prisma.banner.findMany({ select: { key: true } }),
            this.prisma.promoSlide.findMany({ select: { imgKey: true } }),
        ]);

        const s3Keys: string[] = [
            ...products.flatMap(p => p.images as string[]),
            ...brandCats.flatMap(bc => bc.images as string[]),
            ...categories.map(c => c.image).filter((k): k is string => !!k),
            ...brands.map(b => b.logo).filter((k): k is string => !!k),
            ...banners.map(b => b.key).filter((k): k is string => !!k),
            ...promoSlides.map(s => s.imgKey).filter((k): k is string => !!k),
        ];

        // 2. Delete S3 objects in batches of 1000
        if (s3Keys.length > 0) {
            const chunks: string[][] = [];
            for (let i = 0; i < s3Keys.length; i += 1000) chunks.push(s3Keys.slice(i, i + 1000));
            for (const chunk of chunks) {
                try {
                    await this.s3Client.send(new DeleteObjectsCommand({
                        Bucket: this.bucketName,
                        Delete: { Objects: chunk.map(k => ({ Key: k })), Quiet: true },
                    }));
                } catch (err: any) {
                    this.logger.warn(`S3 bulk-delete warning: ${err?.message}`);
                }
            }
            this.logger.log(`Deleted ${s3Keys.length} S3 objects`);
        }

        // 3. Wipe DB in FK-safe order and track counts
        const orderItems = await this.prisma.orderItem.deleteMany({});
        const reviews = await this.prisma.review.deleteMany({});
        const scraperRuns = await this.prisma.scraperRun.deleteMany({});
        const scrapedPrices = await this.prisma.scrapedPrice.deleteMany({});
        const productsDeleted = await this.prisma.product.deleteMany({});
        const otherBrandsDeleted = await this.prisma.otherBrand.deleteMany({});
        const otherSubcategoriesDeleted = await this.prisma.otherSubcategory.deleteMany({});
        const deviceCatalogDeleted = await this.prisma.deviceCatalog.deleteMany({});
        const brandCategoriesDeleted = await this.prisma.brandCategory.deleteMany({});
        const categoriesDeleted = await this.prisma.category.deleteMany({});
        const brandsDeleted = await this.prisma.brand.deleteMany({});
        const bannersDeleted = await this.prisma.banner.deleteMany({});
        const promoSlidesDeleted = await this.prisma.promoSlide.deleteMany({});
        const pricingConfigsDeleted = await this.prisma.pricingConfig.deleteMany({});

        this.logger.log('Database purged — catalog, products, banners, pricing, scraper history all cleared');
        return {
            deleted: s3Keys.length,
            counts: {
                orderItems: orderItems.count,
                reviews: reviews.count,
                scraperRuns: scraperRuns.count,
                scrapedPrices: scrapedPrices.count,
                products: productsDeleted.count,
                otherBrands: otherBrandsDeleted.count,
                otherSubcategories: otherSubcategoriesDeleted.count,
                deviceCatalog: deviceCatalogDeleted.count,
                brandCategories: brandCategoriesDeleted.count,
                categories: categoriesDeleted.count,
                brands: brandsDeleted.count,
                banners: bannersDeleted.count,
                promoSlides: promoSlidesDeleted.count,
                pricingConfigs: pricingConfigsDeleted.count,
            }
        };
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

    // ─── Dynamic catalog seed from seed/categories/ folder ────────────────────

    private async seedCatalogFromFolder(): Promise<number> {
        await this.prisma.orderItem.deleteMany({});
        await this.prisma.product.deleteMany({});
        await this.prisma.deviceCatalog.deleteMany({});

        const categoriesDir = path.join(this.seedDir, 'categories');
        if (!fs.existsSync(categoriesDir)) {
            this.logger.warn('seed/categories/ not found — skipping catalog image seed');
        } else {
            await this.seedCatalogImages(categoriesDir);
        }

        // Upload brand logos from seed/brands/{slug}/logo.png
        await this.seedBrandLogos();

        // Seed the device catalog (models + storage)
        const bcCache = new Map<string, string>();

        for (const dev of DEVICE_CATALOG) {
            const brandSlug    = dev.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const categorySlug = dev.category;

            const brand = await this.prisma.brand.upsert({
                where: { slug: brandSlug },
                update: {},
                create: { name: dev.brand, slug: brandSlug },
            });
            const cat = await this.prisma.category.upsert({
                where: { slug: categorySlug },
                update: { ...categoryFlags(categorySlug) },
                create: { name: capitalize(categorySlug), slug: categorySlug, ...categoryFlags(categorySlug) },
            });

            const bcKey = `${brand.id}::${cat.id}`;
            if (!bcCache.has(bcKey)) {
                const bc = await this.prisma.brandCategory.upsert({
                    where: { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
                    update: {},
                    create: { brandId: brand.id, categoryId: cat.id, images: [] },
                });
                bcCache.set(bcKey, bc.id);
            }

            await this.prisma.deviceCatalog.create({
                data: { brandCategoryId: bcCache.get(bcKey)!, model: dev.model, storageOptions: dev.storageOptions, isActive: true },
            });
        }
        this.logger.log(`Seeded ${DEVICE_CATALOG.length} device catalog entries`);
        return DEVICE_CATALOG.length;
    }

    // Scan seed/categories/{slug}/ — root images → category hero, subfolders → brand-category images
    private async seedCatalogImages(categoriesDir: string) {
        const catFolders = fs.readdirSync(categoriesDir).filter(d =>
            fs.statSync(path.join(categoriesDir, d)).isDirectory(),
        );

        for (const categorySlug of catFolders) {
            const catDir = path.join(categoriesDir, categorySlug);

            // Upsert category
            let cat = await this.prisma.category.upsert({
                where: { slug: categorySlug },
                update: { ...categoryFlags(categorySlug) },
                create: { name: capitalize(categorySlug), slug: categorySlug, ...categoryFlags(categorySlug) },
            });

            // Root-level images → category hero (first one wins)
            if (!cat.image) {
                const heroImg = fs.readdirSync(catDir)
                    .filter(f => isImageFile(f) && fs.statSync(path.join(catDir, f)).isFile())[0];
                if (heroImg) {
                    const s3Key = `catalog/categories/${categorySlug}/${heroImg}`;
                    const uploaded = await this.uploadLocalFile(path.join(catDir, heroImg), s3Key);
                    if (uploaded) {
                        cat = await this.prisma.category.update({ where: { id: cat.id }, data: { image: uploaded } });
                        this.logger.log(`  Category image: ${categorySlug}/${heroImg}`);
                    }
                }
            }

            // Subfolders → brand-category images (e.g. "apple[iphone]", "sony[playstation]")
            const brandFolders = fs.readdirSync(catDir).filter(d =>
                fs.statSync(path.join(catDir, d)).isDirectory(),
            );

            for (const brandFolder of brandFolders) {
                const { slug: brandSlug, alias } = parseBrandFolderName(brandFolder);
                const brandDir  = path.join(catDir, brandFolder);
                // S3 subfolder uses alias if present (e.g. "xbox"), otherwise slug
                const s3BrandPath = alias ?? brandSlug;

                const brand = await this.prisma.brand.upsert({
                    where: { slug: brandSlug },
                    update: {},
                    create: { name: capitalize(brandSlug), slug: brandSlug },
                });

                const bc = await this.prisma.brandCategory.upsert({
                    where: { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
                    update: { alias },
                    create: { brandId: brand.id, categoryId: cat.id, alias, images: [] },
                });

                const existingImages = (bc.images as string[]) ?? [];
                if (existingImages.length === 0) {
                    const imgs = fs.readdirSync(brandDir).filter(isImageFile);
                    const keys: string[] = [];
                    for (const img of imgs) {
                        const s3Key = `catalog/categories/${categorySlug}/${s3BrandPath}/${img}`;
                        const uploaded = await this.uploadLocalFile(path.join(brandDir, img), s3Key);
                        if (uploaded) keys.push(uploaded);
                    }
                    if (keys.length) {
                        await this.prisma.brandCategory.update({ where: { id: bc.id }, data: { images: keys } });
                        this.logger.log(`  ${keys.length} images → catalog/${categorySlug}/${s3BrandPath}/`);
                    }
                }
            }
        }
    }

    // Scan seed/brands/{slug}/ — upload logo.png as brand logo, other images as brand images
    private async seedBrandLogos() {
        const brandsDir = path.join(this.seedDir, 'brands');
        if (!fs.existsSync(brandsDir)) return;

        const dirs = fs.readdirSync(brandsDir).filter(d =>
            fs.statSync(path.join(brandsDir, d)).isDirectory(),
        );

        for (const brandSlug of dirs) {
            const brandDir = path.join(brandsDir, brandSlug);
            const brand = await this.prisma.brand.findUnique({ where: { slug: brandSlug } });
            if (!brand) continue;

            const allImages = fs.readdirSync(brandDir).filter(isImageFile);

            for (const filename of allImages) {
                const localPath = path.join(brandDir, filename);
                const s3Key = `catalog/brands/${brandSlug}/${filename}`;
                const uploaded = await this.uploadLocalFile(localPath, s3Key);
                if (!uploaded) continue;

                if (filename === 'logo.png' && !brand.logo) {
                    await this.prisma.brand.update({ where: { id: brand.id }, data: { logo: uploaded } });
                    this.logger.log(`  Logo → catalog/brands/${brandSlug}/logo.png`);
                }
            }
        }
    }

    // ─── Banners ──────────────────────────────────────────────────────────────

    private async seedBanners(): Promise<number> {
        const bannersDir = path.join(this.seedDir, 'banners');
        if (!fs.existsSync(bannersDir)) return 0;

        // Only root-level images (skip promo_banners/ subfolder)
        const files = fs.readdirSync(bannersDir)
            .filter(f => isImageFile(f) && fs.statSync(path.join(bannersDir, f)).isFile());
        let count = 0;

        for (let i = 0; i < files.length; i++) {
            const filename = files[i]!;
            const s3Key = `banners/${filename}`;
            const existing = await this.prisma.banner.findUnique({ where: { key: s3Key } });
            if (!existing) {
                const uploaded = await this.uploadLocalFile(path.join(bannersDir, filename), s3Key);
                if (uploaded) {
                    await this.prisma.banner.create({
                        data: { key: uploaded, label: filename.replace(/\.[^.]+$/, ''), order: i },
                    });
                    count++;
                    this.logger.log(`  Banner: ${filename}`);
                }
            }
        }
        this.logger.log(`Seeded ${count} background banners`);
        return count;
    }

    // ─── Promo slides ─────────────────────────────────────────────────────────

    private async seedPromoSlides(): Promise<number> {
        const slidesJsonPath = path.join(this.seedDir, 'banners', 'promo_banners', 'slides.json');
        if (!fs.existsSync(slidesJsonPath)) return 0;

        const promoDir = path.join(this.seedDir, 'banners', 'promo_banners');
        const raw: any[] = JSON.parse(fs.readFileSync(slidesJsonPath, 'utf8'));
        let count = 0;

        for (let i = 0; i < raw.length; i++) {
            const slide = raw[i]!;
            const imgFilename: string = slide.img ?? '';

            // Upload image if present
            let imgKey: string | null = null;
            if (imgFilename) {
                const localPath = path.join(promoDir, imgFilename);
                const s3Key = `banners/promo/${imgFilename}`;
                imgKey = await this.uploadLocalFile(localPath, s3Key);
                if (imgKey) this.logger.log(`  Promo image: ${imgFilename}`);
            }

            // Map all fields from slides.json to the DB model
            const slideData = {
                imgKey:      imgKey ?? null,
                tabTitle:    slide.tabTitle    ?? '',
                tag:         slide.tag         ?? '',
                titleLine1:  slide.titleLine1  ?? '',
                titleLine2:  slide.titleLine2  ?? '',
                titleItalic: slide.titleItalic ?? '',
                title:       [slide.titleLine1, slide.titleLine2].filter(Boolean).join(' '),
                subtitle:    slide.desc        ?? '',
                badgeA:      slide.badgeA      ?? '',
                badgeB:      slide.badgeB      ?? '',
                specs:       Array.isArray(slide.specs) ? slide.specs.join(',') : (slide.specs ?? ''),
                themeColor:  slide.themeColor  ?? 'from-blue-500 to-indigo-600',
                bgGlow:      slide.bgGlow      ?? 'rgba(59,130,246,0.15)',
                btnText:     slide.btnText     ?? 'Shop Now',
                btnLink:     slide.btnLink     ?? '/',
                isActive:    true,
            };

            // Upsert by order so re-seeding is idempotent
            const existing = await this.prisma.promoSlide.findFirst({ where: { order: i } });
            if (existing) {
                await this.prisma.promoSlide.update({
                    where: { id: existing.id },
                    data: { ...slideData, imgKey: imgKey ?? existing.imgKey },
                });
            } else {
                await this.prisma.promoSlide.create({
                    data: { ...slideData, order: i },
                });
                count++;
            }
        }
        this.logger.log(`Seeded ${count} promo slides`);
        return raw.length;
    }

    private async uploadImage(
        catSlug: string,
        brandSlug: string,
        deviceSlug: string,
        imageFilename: string,
    ): Promise<string> {
        const localPath = path.join(this.downloadsDir, imageFilename);
        if (!fs.existsSync(localPath)) throw new Error(`Image file not found: ${localPath}`);
        const s3Key = `products/${catSlug}/${brandSlug}/${deviceSlug}/${imageFilename}`;
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(imageFilename).toLowerCase();
        const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                   : ext === '.png' ? 'image/png' : 'image/jpeg';
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: buffer,
            ContentType: mime,
        }));
        return s3Key;
    }

    // ─── Others (accessories, smartwatches, games, etc.) ─────────────────────
    // Uses OtherBrand + OtherSubcategory so these products appear on /products/others
    // and NOT in the main catalog.

    private async seedOthers(): Promise<number> {
        const othersJsonPath = path.join(this.seedDir, 'others', 'products.json');
        if (!fs.existsSync(othersJsonPath)) {
            this.logger.warn('others/products.json not found — skipping');
            return 0;
        }

        const data: Record<string, any[]> = JSON.parse(fs.readFileSync(othersJsonPath, 'utf8'));

        const CAT_NAME: Record<string, string> = {
            cables:       'Cables',
            chargers:     'Chargers',
            films:        'Films',
            games:        'Games',
            graphics:     'Graphics Cards',
            lens:         'Camera Lenses',
            memory:       'Memory',
            mouse:        'Mouse & Peripherals',
            pen:          'Stylus & Pens',
            smart_watches:'Smartwatches',
            smartwatches: 'Smartwatches',
            storage:      'Storage',
        };

        // Cache to avoid redundant DB round-trips
        const subcatCache = new Map<string, string>(); // name → id
        const brandCache  = new Map<string, string>(); // name → id

        let total = 0;

        for (const [subcatKey, items] of Object.entries(data)) {
            const subcatName = CAT_NAME[subcatKey] ?? capitalize(subcatKey.replace(/_/g, ' '));

            for (const item of items) {
                try {
                    const brandName = item.brand as string;

                    // OtherBrand (keyed by name)
                    if (!brandCache.has(brandName)) {
                        const existing = await this.prisma.otherBrand.findFirst({ where: { name: brandName } });
                        const ob = existing
                            ?? await this.prisma.otherBrand.create({ data: { name: brandName } });
                        brandCache.set(brandName, ob.id);
                    }
                    const otherBrandId = brandCache.get(brandName)!;

                    // OtherSubcategory (keyed by display name)
                    if (!subcatCache.has(subcatName)) {
                        const existing = await this.prisma.otherSubcategory.findFirst({ where: { name: subcatName } });
                        const os = existing
                            ?? await this.prisma.otherSubcategory.create({ data: { name: subcatName } });
                        subcatCache.set(subcatName, os.id);
                    }
                    const otherSubcategoryId = subcatCache.get(subcatName)!;

                    // Upload image
                    const imgPath: string = item.image ?? '';
                    const parts = imgPath.replace(/^\//, '').split('/');
                    const localImgPath = path.join(this.seedDir, ...parts);
                    let s3ImageKey: string | null = null;
                    if (fs.existsSync(localImgPath)) {
                        const s3Key = `products/${parts.slice(0, -1).join('/')}/${parts[parts.length - 1]}`;
                        s3ImageKey = await this.uploadLocalFile(localImgPath, s3Key);
                    }

                    const productData = {
                        otherBrand:        { connect: { id: otherBrandId } },
                        otherSubcategory:  { connect: { id: otherSubcategoryId } },
                        name:          item.name,
                        slug:          item.id,
                        condition:     'Pristine',
                        storage:       '',
                        price:         typeof item.price === 'number' ? item.price : null,
                        comparePrice:  typeof item.comparePrice === 'number' ? item.comparePrice : null,
                        stock:         10,
                        images:        s3ImageKey ? [s3ImageKey] : [],
                        specs:         {},
                        description:   '',
                        rating:        0,
                        reviewCount:   0,
                        pricingStatus: 'manual',
                        isActive:      true,
                    };

                    const existing = await this.prisma.product.findUnique({ where: { slug: item.id } });
                    if (existing) {
                        await this.prisma.product.update({ where: { slug: item.id }, data: productData as never });
                    } else {
                        await this.prisma.product.create({ data: productData as never });
                        total++;
                    }
                } catch (e: any) {
                    this.logger.error(`Failed to seed others/${subcatKey}/${item.id}: ${e.message}`);
                }
            }
            this.logger.log(`  Others seeded: ${subcatKey} (${items.length} items)`);
        }

        this.logger.log(`Seeded ${total} others products`);
        return total;
    }

    private normalizeCategory(raw: string): string {
        const map: Record<string, string> = {
            'phones': 'phones', 'tablets': 'tablets',
            'consoles': 'consoles', 'laptops': 'laptops',
            'audio': 'audio', 'accessories': 'accessories',
            'smartwatches': 'smartwatches', 'games': 'games', 'films': 'films',
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
                        update: { ...categoryFlags(categorySlug) },
                        create: { name: catName, slug: categorySlug, ...categoryFlags(categorySlug) },
                    });
                    const bc = await this.prisma.brandCategory.upsert({
                        where: { brandId_categoryId: { brandId: brandRecord.id, categoryId: catRecord.id } },
                        update: {},
                        create: { brandId: brandRecord.id, categoryId: catRecord.id, images: [] },
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

                const catSlug    = this.normalizeCategory(prod.category ?? 'phones');
                const brandSlug  = (brand as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const deviceSlug = (model as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');

                const s3Keys: string[] = [];
                if (Array.isArray(prod.images)) {
                    for (const imgFilename of prod.images as string[]) {
                        try {
                            s3Keys.push(await this.uploadImage(catSlug, brandSlug, deviceSlug, imgFilename));
                        } catch (e: any) {
                            this.logger.warn(`Image skipped "${prod.name}" / "${imgFilename}": ${e.message}`);
                        }
                    }
                }

                const data = {
                    catalog: catalogId ? { connect: { id: catalogId } } : undefined,
                    name: prod.name,
                    slug,
                    condition: prod.condition,
                    storage,
                    price: null,
                    comparePrice: null,
                    stock: Number(prod.stock ?? 10),
                    images: s3Keys.length > 0 ? s3Keys : (Array.isArray(prod.images) ? prod.images : []),
                    specs: remainingSpecs ?? {},
                    description: prod.description ?? '',
                    rating: Number(prod.rating ?? 0),
                    reviewCount: Number(prod.reviewCount ?? 0),
                    pricingStatus: 'no_data',
                    isActive: false,
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

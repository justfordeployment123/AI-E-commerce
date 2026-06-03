/**
 * Standalone seed script — run with:
 *   npx ts-node --project tsconfig.json prisma/seed.ts
 *
 * Reads from prisma/seed/ folder structure:
 *   seed/categories/{slug}/          → category hero image (first image found)
 *   seed/categories/{slug}/{brand}/  → brand-category showcase images (all images)
 *   seed/brands/{slug}/              → logo.png + brand images
 *   seed/banners/                    → background banner images (all images)
 *   seed/banners/promo_banners/      → slides.json + promo images
 *   seed/products/                   → products.json + product images
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
    S3Client, PutObjectCommand,
    CreateBucketCommand, HeadBucketCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// ─── DB + S3 setup ────────────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL
    ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

const bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';
const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
    credentials: {
        accessKeyId:     process.env.GARAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
});

const SEED_DIR = path.join(__dirname, 'seed');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isImage(name: string) {
    return /\.(jpg|jpeg|png|webp)$/i.test(name);
}

/**
 * "apple[iphone]" → { slug: "apple", alias: "iphone" }
 * "samsung"       → { slug: "samsung", alias: null }
 *
 * slug  → used for DB lookups (the actual brand)
 * alias → used for Garage S3 subfolder path (the product line name)
 *         falls back to slug if no alias
 */
function parseBrandFolder(folderName: string): { slug: string; alias: string } {
    const match = folderName.match(/^([^\[]+)(?:\[([^\]]+)\])?$/);
    const slug  = (match?.[1] ?? folderName).trim().toLowerCase();
    const alias = (match?.[2] ?? slug).trim().toLowerCase();
    return { slug, alias };
}

/** Capitalise first letter */
function cap(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

async function ensureBucket() {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`  Bucket "${bucketName}" created`);
    }
}

async function uploadFile(localPath: string, s3Key: string): Promise<string> {
    const buffer = fs.readFileSync(localPath);
    const ext    = path.extname(localPath).toLowerCase();
    const mime   = ext === '.png'  ? 'image/png'
                 : ext === '.webp' ? 'image/webp'
                 : 'image/jpeg';
    await s3.send(new PutObjectCommand({
        Bucket: bucketName, Key: s3Key, Body: buffer, ContentType: mime,
    }));
    return s3Key;
}

// ─── Phase 1: Categories + brand-category images ──────────────────────────────

async function seedCategories() {
    const catDir = path.join(SEED_DIR, 'categories');
    if (!fs.existsSync(catDir)) return;

    const catFolders = fs.readdirSync(catDir)
        .filter(d => fs.statSync(path.join(catDir, d)).isDirectory());

    for (const catSlug of catFolders) {
        const catPath = path.join(catDir, catSlug);
        const catName = cap(catSlug);

        // Upsert category
        let cat = await prisma.category.upsert({
            where:  { slug: catSlug },
            update: {},
            create: { name: catName, slug: catSlug },
        });

        // Hero image — first image at root of category folder
        if (!cat.image) {
            const heroFile = fs.readdirSync(catPath)
                .find(f => isImage(f) && fs.statSync(path.join(catPath, f)).isFile());
            if (heroFile) {
                const key = await uploadFile(
                    path.join(catPath, heroFile),
                    `catalog/categories/${catSlug}/${heroFile}`,
                );
                cat = await prisma.category.update({ where: { id: cat.id }, data: { image: key } });
                console.log(`  Category image: ${catSlug}/${heroFile}`);
            }
        }

        // Brand subfolders → brand-category images
        const brandFolders = fs.readdirSync(catPath)
            .filter(d => fs.statSync(path.join(catPath, d)).isDirectory());

        for (const brandFolder of brandFolders) {
            const { slug: brandSlug, alias: brandAlias } = parseBrandFolder(brandFolder);
            const brandPath = path.join(catPath, brandFolder);

            // slug → DB brand identity; alias → S3 subfolder (e.g. "xbox" not "microsoft")
            const brand = await prisma.brand.upsert({
                where:  { slug: brandSlug },
                update: {},
                create: { name: cap(brandSlug), slug: brandSlug },
            });

            // alias = the product-line display name (e.g. "iphone", "xbox", "playstation")
            // Capitalise it for display: "iphone" → "iPhone" handled in UI, store raw for flexibility
            const alias = brandAlias !== brandSlug ? brandAlias : null;
            const bc = await prisma.brandCategory.upsert({
                where:  { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
                update: { alias },
                create: { brandId: brand.id, categoryId: cat.id, alias, images: [] },
            });

            if (((bc.images as string[]) ?? []).length === 0) {
                const imgs = fs.readdirSync(brandPath).filter(isImage);
                const keys: string[] = [];
                for (const img of imgs) {
                    // Use alias in Garage path: catalog/categories/consoles/xbox/
                    keys.push(await uploadFile(
                        path.join(brandPath, img),
                        `catalog/categories/${catSlug}/${brandAlias}/${img}`,
                    ));
                }
                if (keys.length) {
                    await prisma.brandCategory.update({ where: { id: bc.id }, data: { images: keys } });
                    console.log(`  Brand-cat images (${keys.length}): ${catSlug}/${brandAlias}/`);
                }
            }
        }
    }
    console.log('✓ Categories & brand-category images done');
}

// ─── Phase 2: Brand logos + brand images ─────────────────────────────────────

async function seedBrands() {
    const brandsDir = path.join(SEED_DIR, 'brands');
    if (!fs.existsSync(brandsDir)) return;

    const dirs = fs.readdirSync(brandsDir)
        .filter(d => fs.statSync(path.join(brandsDir, d)).isDirectory());

    for (const brandSlug of dirs) {
        const brandPath = path.join(brandsDir, brandSlug);

        const brand = await prisma.brand.upsert({
            where:  { slug: brandSlug },
            update: {},
            create: { name: cap(brandSlug), slug: brandSlug },
        });

        const imgs = fs.readdirSync(brandPath).filter(isImage);
        for (const img of imgs) {
            const s3Key = `catalog/brands/${brandSlug}/${img}`;
            await uploadFile(path.join(brandPath, img), s3Key);

            // logo.png → set as brand logo
            if (img === 'logo.png' && !brand.logo) {
                await prisma.brand.update({ where: { id: brand.id }, data: { logo: s3Key } });
                console.log(`  Logo: brands/${brandSlug}/logo.png`);
            }
        }
    }
    console.log('✓ Brand logos & images done');
}

// ─── Phase 3: Background banners ─────────────────────────────────────────────

async function seedBanners() {
    const bannersDir = path.join(SEED_DIR, 'banners');
    if (!fs.existsSync(bannersDir)) return;

    // Only root-level images (skip promo_banners/ subfolder)
    const files = fs.readdirSync(bannersDir)
        .filter(f => isImage(f) && fs.statSync(path.join(bannersDir, f)).isFile());

    for (let i = 0; i < files.length; i++) {
        const filename = files[i]!;
        const s3Key = `banners/${filename}`;
        const existing = await prisma.banner.findUnique({ where: { key: s3Key } });
        if (!existing) {
            await uploadFile(path.join(bannersDir, filename), s3Key);
            await prisma.banner.create({
                data: { key: s3Key, label: filename.replace(/\.[^.]+$/, ''), order: i },
            });
            console.log(`  Banner: ${filename}`);
        }
    }
    console.log('✓ Banners done');
}

// ─── Phase 4: Promo slides (reads slides.json) ────────────────────────────────

async function seedPromoSlides() {
    const slidesPath = path.join(SEED_DIR, 'banners', 'promo_banners', 'slides.json');
    if (!fs.existsSync(slidesPath)) return;

    const promoDir = path.join(SEED_DIR, 'banners', 'promo_banners');
    const slides: any[] = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]!;
        const imgFile: string = slide.img ?? '';
        let imgKey: string | null = null;

        if (imgFile) {
            const localPath = path.join(promoDir, imgFile);
            if (fs.existsSync(localPath)) {
                imgKey = await uploadFile(localPath, `banners/promo/${imgFile}`);
                console.log(`  Promo image: ${imgFile}`);
            }
        }

        const title    = [slide.titleLine1, slide.titleLine2].filter(Boolean).join(' ');
        const subtitle = slide.desc ?? '';
        const btnText  = slide.btnText ?? 'Shop Now';
        const btnLink  = slide.btnLink ?? '/';

        const existing = await prisma.promoSlide.findFirst({ where: { order: i } });
        if (existing) {
            await prisma.promoSlide.update({
                where: { id: existing.id },
                data: { imgKey: imgKey ?? existing.imgKey, title, subtitle, btnText, btnLink },
            });
        } else {
            await prisma.promoSlide.create({
                data: { imgKey, title, subtitle, btnText, btnLink, order: i, isActive: true },
            });
        }
    }
    console.log('✓ Promo slides done');
}

// ─── Phase 5: Device catalog (derived from products.json) ────────────────────

async function seedDeviceCatalog(productsData: any[]) {
    // Clear existing
    await prisma.orderItem.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.deviceCatalog.deleteMany({});

    const NORM: Record<string, string> = {
        'laptops / macbooks': 'laptops',
        'accessories': 'audio',
    };
    const normCat = (raw: string) => NORM[raw.toLowerCase()] ?? raw.toLowerCase();

    // Build unique brand+model+category combos from products.json
    const catalogMap = new Map<string, { brandSlug: string; brandName: string; catSlug: string; model: string; storage: Set<string> }>();

    for (const prod of productsData) {
        const brandName = prod.brand as string;
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catSlug   = normCat(prod.category ?? 'phones');
        const model     = prod.model as string;
        const storage   = (prod.specs?.Storage || prod.specs?.storage || '') as string;
        const key       = `${brandSlug}::${catSlug}::${model}`;
        if (!catalogMap.has(key)) catalogMap.set(key, { brandSlug, brandName, catSlug, model, storage: new Set() });
        if (storage) catalogMap.get(key)!.storage.add(storage);
    }

    const catalogIdMap = new Map<string, string>();

    for (const [key, data] of catalogMap) {
        // Ensure brand exists
        const brand = await prisma.brand.upsert({
            where:  { slug: data.brandSlug },
            update: {},
            create: { name: data.brandName, slug: data.brandSlug },
        });
        // Ensure category exists
        const cat = await prisma.category.upsert({
            where:  { slug: data.catSlug },
            update: {},
            create: { name: cap(data.catSlug), slug: data.catSlug },
        });
        // Ensure brand-category link
        const bc = await prisma.brandCategory.upsert({
            where:  { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
            update: {},
            create: { brandId: brand.id, categoryId: cat.id, images: [] },
        });
        // Create device catalog entry
        const entry = await prisma.deviceCatalog.upsert({
            where:  { brandCategoryId_model: { brandCategoryId: bc.id, model: data.model } },
            update: { storageOptions: Array.from(data.storage) },
            create: { brandCategoryId: bc.id, model: data.model, storageOptions: Array.from(data.storage), isActive: true },
        });
        catalogIdMap.set(key, entry.id);
    }

    console.log(`✓ Device catalog: ${catalogMap.size} entries`);
    return catalogIdMap;
}

// ─── Phase 6: Products (reads products.json, uploads images) ─────────────────

async function seedProducts(productsData: any[], catalogIdMap: Map<string, string>) {
    const productsDir = path.join(SEED_DIR, 'products');

    const NORM: Record<string, string> = {
        'laptops / macbooks': 'laptops',
        'accessories': 'audio',
    };
    const normCat = (raw: string) => NORM[raw.toLowerCase()] ?? raw.toLowerCase();

    let created = 0, skipped = 0;

    for (const prod of productsData) {
        const brandName = prod.brand as string;
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catSlug   = normCat(prod.category ?? 'phones');
        const model     = prod.model as string;
        const deviceSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catalogKey = `${brandSlug}::${catSlug}::${model}`;
        const catalogId  = catalogIdMap.get(catalogKey);

        if (!catalogId) { skipped++; continue; }

        // Upload images → products/{cat}/{brand}/{device}/{filename}
        const s3Keys: string[] = [];
        if (Array.isArray(prod.images)) {
            for (const imgFile of prod.images as string[]) {
                const localPath = path.join(productsDir, imgFile);
                if (!fs.existsSync(localPath)) continue;
                try {
                    s3Keys.push(await uploadFile(
                        localPath,
                        `products/${catSlug}/${brandSlug}/${deviceSlug}/${imgFile}`,
                    ));
                } catch (e: any) {
                    console.warn(`  Skipped image ${imgFile}: ${e.message}`);
                }
            }
        }

        const storage = (prod.specs?.Storage || prod.specs?.storage || '') as string;
        const { Storage: _S, storage: _s, ...specs } = prod.specs ?? {};

        try {
            await prisma.product.create({
                data: {
                    catalogId,
                    name:         prod.name,
                    slug:         prod.slug,
                    condition:    prod.condition,
                    storage,
                    price:        Number(prod.price),
                    comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                    stock:        Number(prod.stock ?? 0),
                    images:       s3Keys,
                    specs:        specs ?? {},
                    description:  prod.description ?? '',
                    rating:       Number(prod.rating ?? 0),
                    reviewCount:  Number(prod.reviewCount ?? 0),
                    isActive:     prod.isActive !== false,
                },
            });
            created++;
            if (created % 10 === 0) console.log(`  ${created}/${productsData.length} products...`);
        } catch (e: any) {
            console.error(`  Failed "${prod.name}": ${e.message}`);
        }
    }
    console.log(`✓ Products: ${created} created, ${skipped} skipped`);
}

// ─── Phase 7: Other products (chargers, cables, memory, etc.) ────────────────

async function seedOtherProducts() {
    const othersJsonPath = path.join(SEED_DIR, 'others', 'products.json');
    if (!fs.existsSync(othersJsonPath)) {
        console.log('  No others/products.json found, skipping');
        return;
    }

    const othersData: Record<string, any[]> = JSON.parse(fs.readFileSync(othersJsonPath, 'utf8'));

    // Ensure "other" category exists
    const cat = await prisma.category.upsert({
        where:  { slug: 'other' },
        update: {},
        create: { name: 'Other', slug: 'other' },
    });

    let created = 0, skipped = 0;

    for (const [subcategory, products] of Object.entries(othersData)) {
        for (const prod of products) {
            const brandName: string = prod.brand ?? 'Generic';
            const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const brand = await prisma.brand.upsert({
                where:  { slug: brandSlug },
                update: {},
                create: { name: brandName, slug: brandSlug },
            });

            const bc = await prisma.brandCategory.upsert({
                where:  { brandId_categoryId: { brandId: brand.id, categoryId: cat.id } },
                update: {},
                create: { brandId: brand.id, categoryId: cat.id, images: [] },
            });

            const model: string = prod.name;
            const entry = await prisma.deviceCatalog.upsert({
                where:  { brandCategoryId_model: { brandCategoryId: bc.id, model } },
                update: {},
                create: { brandCategoryId: bc.id, model, storageOptions: [], isActive: true },
            });

            // Upload image — prod.image is like "/others/chargers/apple-20w-usb-c-power-adapter.png"
            const s3Keys: string[] = [];
            const imgRelative: string = (prod.image ?? '').replace(/^\/others\//, '');
            if (imgRelative) {
                const localPath = path.join(SEED_DIR, 'others', imgRelative);
                if (fs.existsSync(localPath)) {
                    const imgFile = path.basename(localPath);
                    try {
                        s3Keys.push(await uploadFile(
                            localPath,
                            `products/other/${brandSlug}/${subcategory}/${imgFile}`,
                        ));
                    } catch (e: any) {
                        console.warn(`  Skipped image ${imgRelative}: ${e.message}`);
                    }
                }
            }

            const slug: string = prod.id;
            const existing = await prisma.product.findUnique({ where: { slug } });
            if (existing) { skipped++; continue; }

            try {
                await prisma.product.create({
                    data: {
                        catalogId:    entry.id,
                        name:         prod.name,
                        slug,
                        condition:    'Good',
                        storage:      '',
                        price:        Number(prod.price),
                        comparePrice: prod.comparePrice ? Number(prod.comparePrice) : null,
                        stock:        10,
                        images:       s3Keys,
                        specs:        { subcategory },
                        description:  prod.name,
                        rating:       4.5,
                        reviewCount:  0,
                        isActive:     true,
                    },
                });
                created++;
            } catch (e: any) {
                console.error(`  Failed "${prod.name}": ${e.message}`);
            }
        }
    }
    console.log(`✓ Other products: ${created} created, ${skipped} already existed`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('Starting seed...\n');

    const productsJsonPath = path.join(SEED_DIR, 'products', 'products.json');
    if (!fs.existsSync(productsJsonPath)) {
        throw new Error(`products.json not found at ${productsJsonPath}`);
    }
    const productsData: any[] = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));
    console.log(`Loaded ${productsData.length} products from products.json\n`);

    await ensureBucket();

    await seedCategories();    // categories + brand-category images
    await seedBrands();        // brand logos + brand images
    await seedBanners();       // background banners
    await seedPromoSlides();   // promo carousel from slides.json

    const catalogIdMap = await seedDeviceCatalog(productsData);
    await seedProducts(productsData, catalogIdMap);
    await seedOtherProducts();

    console.log('\nSeed complete.');
}

main()
    .catch(e => { console.error('Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

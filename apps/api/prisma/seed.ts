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
 *   seed/banners/Grade/              → grade guide images, filename prefix
 *                                       (a/b/c/f/new) picks the grade
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

// ─── Category names + descriptions — seeded as defaults, editable in admin ──────
// name        = short nav label  (e.g. "Audio")
// displayName = full page heading (e.g. "Audio & Headphones")
// Only main navbar categories — others (accessories, smartwatches, games, films) are admin-managed
const CATEGORY_META_SEED: Record<string, { name: string; displayName: string; description: string }> = {
    phones:   { name: 'Phones',    displayName: 'Smartphones',        description: 'Certified refurbished smartphones with warranty. Every handset is unlocked, tested, and backed by our quality guarantee.' },
    tablets:  { name: 'Tablets',   displayName: 'Tablets',            description: 'Refurbished iPads, Samsung Galaxy Tabs and Surface devices. Fully tested, screen checked, and sold with a warranty.' },
    laptops:  { name: 'Laptops',   displayName: 'Laptops & MacBooks', description: 'Refurbished MacBooks, ThinkPads, Dell XPS and more. Every laptop is battery-tested, keyboard-checked, and ships with a warranty.' },
    audio:    { name: 'Audio',     displayName: 'Audio & Headphones', description: 'Genuine refurbished headphones, earbuds and speakers. Ultrasonic cleaned, battery-tested, and quality-graded.' },
    gaming:   { name: 'Gaming',    displayName: 'Gaming',             description: 'Certified refurbished PlayStation, Xbox and Nintendo consoles. Disc drives tested, HDMI verified, controllers included.' },
};

// ─── Phase 1: Categories + brand-category images ──────────────────────────────

async function seedCategories() {
    const catDir = path.join(SEED_DIR, 'categories');
    if (!fs.existsSync(catDir)) return;

    const catFolders = fs.readdirSync(catDir)
        .filter(d => fs.statSync(path.join(catDir, d)).isDirectory());

    for (const catSlug of catFolders) {
        const catPath = path.join(catDir, catSlug);
        const meta    = CATEGORY_META_SEED[catSlug];
        const catName = meta?.name ?? cap(catSlug);
        const desc    = meta?.description;

        // Upsert category — always set name + displayName; backfill description if not yet customised
        let cat = await prisma.category.upsert({
            where:  { name: catName },
            update: { name: catName, displayName: meta?.displayName ?? catName },
            create: { name: catName, description: desc, displayName: meta?.displayName ?? catName },
        });

        if (!cat.description && desc) {
            cat = await prisma.category.update({ where: { id: cat.id }, data: { description: desc } });
            console.log(`  Description set: ${catSlug}`);
        }

        // All images at root of category folder
        const imageFiles = fs.readdirSync(catPath)
            .filter(f => isImage(f) && fs.statSync(path.join(catPath, f)).isFile())
            .sort();

        if (imageFiles.length > 0 && cat.images.length === 0) {
            const keys: string[] = [];
            for (const imgFile of imageFiles) {
                const key = await uploadFile(
                    path.join(catPath, imgFile),
                    `catalog/categories/${catSlug}/${imgFile}`,
                );
                keys.push(key);
            }
            cat = await prisma.category.update({
                where: { id: cat.id },
                data: {
                    image:  keys[0],   // first image stays as primary hero
                    images: keys,      // all images stored for carousel/random pick
                },
            });
            console.log(`  Category images (${keys.length}): ${catSlug}`);
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

// ─── Phase 3b: Grade banners (homepage "Grade Guide" section) ────────────────
// seed/banners/Grade/{a,b,c,f,new}_N.png → one small gallery per condition
// grade, uploaded to banners/grade/{grade}/ (lowercase, matching the existing
// banners/promo convention) and rows in the GradeBanner table.

function parseGradeFromFilename(filename: string): string | null {
    const base = filename.toLowerCase();
    if (base.startsWith('new')) return 'NEW';
    if (base.startsWith('a')) return 'A';
    if (base.startsWith('b')) return 'B';
    if (base.startsWith('c')) return 'C';
    if (base.startsWith('f')) return 'F';
    return null;
}

async function seedGradeBanners() {
    const gradeDir = path.join(SEED_DIR, 'banners', 'Grade');
    if (!fs.existsSync(gradeDir)) return;

    const files = fs.readdirSync(gradeDir)
        .filter(f => isImage(f) && fs.statSync(path.join(gradeDir, f)).isFile());

    const orderByGrade: Record<string, number> = {};

    for (const filename of files) {
        const grade = parseGradeFromFilename(filename);
        if (!grade) {
            console.log(`  Skipping ${filename} — filename doesn't start with a/b/c/f/new`);
            continue;
        }

        const s3Key = `banners/grade/${grade.toLowerCase()}/${filename}`;
        const existing = await prisma.gradeBanner.findUnique({ where: { key: s3Key } });
        if (!existing) {
            const order = orderByGrade[grade] ?? 0;
            await uploadFile(path.join(gradeDir, filename), s3Key);
            await prisma.gradeBanner.create({
                data: { grade, key: s3Key, label: filename.replace(/\.[^.]+$/, ''), order },
            });
            orderByGrade[grade] = order + 1;
            console.log(`  Grade banner (${grade}): ${filename}`);
        }
    }
    console.log('✓ Grade banners done');
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

        const existing = await prisma.promoSlide.findFirst({ where: { order: i } });
        if (existing) {
            await prisma.promoSlide.update({
                where: { id: existing.id },
                data: { ...slideData, imgKey: imgKey ?? existing.imgKey },
            });
        } else {
            await prisma.promoSlide.create({
                data: { ...slideData, order: i },
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
            where:  { name: cap(data.catSlug) },
            update: {},
            create: { name: cap(data.catSlug) },
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

const SUBCAT_DISPLAY: Record<string, string> = {
    chargers:     'Chargers',
    cables:       'Cables',
    memory:       'Memory',
    storage:      'Storage',
    mouse:        'Mouse',
    pen:          'Pen',
    graphics:     'Graphics',
    lens:         'Lens',
    smart_watches:'Smart Watches',
    games:        'Games',
    films:        'Films',
};

async function seedOtherProducts() {
    const othersJsonPath = path.join(SEED_DIR, 'others', 'products.json');
    if (!fs.existsSync(othersJsonPath)) {
        console.log('  No others/products.json found, skipping');
        return;
    }

    const othersData: Record<string, any[]> = JSON.parse(fs.readFileSync(othersJsonPath, 'utf8'));
    let created = 0, skipped = 0;

    for (const [subcategory, products] of Object.entries(othersData)) {
        const subcatName = SUBCAT_DISPLAY[subcategory] ?? subcategory;

        const subcat = await prisma.otherSubcategory.upsert({
            where:  { name: subcatName },
            update: {},
            create: { name: subcatName },
        });

        for (const prod of products) {
            const brandName: string = prod.brand ?? 'Generic';
            const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const brand = await prisma.otherBrand.upsert({
                where:  { name: brandName },
                update: {},
                create: { name: brandName },
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
                        otherBrandId:       brand.id,
                        otherSubcategoryId: subcat.id,
                        name:               prod.name,
                        slug,
                        condition:          'C',
                        storage:            '',
                        price:              Number(prod.price),
                        comparePrice:       prod.comparePrice ? Number(prod.comparePrice) : null,
                        stock:              10,
                        images:             s3Keys,
                        specs:              {},
                        description:        prod.name,
                        rating:             4.5,
                        reviewCount:        0,
                        isActive:           true,
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

async function seedStores() {
    await prisma.store.upsert({
        where: { id: 'leicester-central' },
        update: {
            name: 'TechStop Leicester',
            address: '148B Melton Rd',
            city: 'Leicester',
            postcode: 'LE4 5EE',
            phone: '+447343055398',
            openingHours: 'Mon–Sat, 9:00 AM – 6:00 PM',
            mapsEmbedUrl: 'https://maps.google.com/maps?q=TechStop+Leicester&ftid=0x487761ad81f139e7:0x56323f6a6627c65e&t=&z=17&ie=UTF8&iwloc=&output=embed',
            isActive: true,
        },
        create: {
            id: 'leicester-central',
            name: 'TechStop Leicester',
            address: '148B Melton Rd',
            city: 'Leicester',
            postcode: 'LE4 5EE',
            phone: '+447343055398',
            openingHours: 'Mon–Sat, 9:00 AM – 6:00 PM',
            mapsEmbedUrl: 'https://maps.google.com/maps?q=TechStop+Leicester&ftid=0x487761ad81f139e7:0x56323f6a6627c65e&t=&z=17&ie=UTF8&iwloc=&output=embed',
            isActive: true,
        }
    });
    console.log('✓ Stores done');
}

async function seedHelplines() {
    await prisma.helplineNumber.upsert({
        where: { id: 'helpline-store' },
        update: {
            label: 'Leicester Store Helpline',
            number: '+447343055398',
            isActive: true,
            order: 0,
        },
        create: {
            id: 'helpline-store',
            label: 'Leicester Store Helpline',
            number: '+447343055398',
            isActive: true,
            order: 0,
        }
    });
    console.log('✓ Helplines done');
}

// ─── Trade-in search devices ──────────────────────────────────────────────────

const TRADE_IN_SEED: { name: string; brand: string; category: string }[] = [
    // Phones — Apple
    { name: "iPhone 15 Pro Max",       brand: "Apple",           category: "Phone" },
    { name: "iPhone 15 Pro",           brand: "Apple",           category: "Phone" },
    { name: "iPhone 15 Plus",          brand: "Apple",           category: "Phone" },
    { name: "iPhone 15",               brand: "Apple",           category: "Phone" },
    { name: "iPhone 14 Pro Max",       brand: "Apple",           category: "Phone" },
    { name: "iPhone 14 Pro",           brand: "Apple",           category: "Phone" },
    { name: "iPhone 14 Plus",          brand: "Apple",           category: "Phone" },
    { name: "iPhone 14",               brand: "Apple",           category: "Phone" },
    { name: "iPhone 13 Pro Max",       brand: "Apple",           category: "Phone" },
    { name: "iPhone 13 Pro",           brand: "Apple",           category: "Phone" },
    { name: "iPhone 13",               brand: "Apple",           category: "Phone" },
    { name: "iPhone 12 Pro Max",       brand: "Apple",           category: "Phone" },
    { name: "iPhone 12 Pro",           brand: "Apple",           category: "Phone" },
    { name: "iPhone 12",               brand: "Apple",           category: "Phone" },
    { name: "iPhone 11 Pro Max",       brand: "Apple",           category: "Phone" },
    { name: "iPhone 11 Pro",           brand: "Apple",           category: "Phone" },
    { name: "iPhone 11",               brand: "Apple",           category: "Phone" },
    // Phones — Samsung
    { name: "Galaxy S24 Ultra",        brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S24+",             brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S24",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S23 Ultra",        brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S23+",             brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S23",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S22 Ultra",        brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S22+",             brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S22",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S21 Ultra",        brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S21+",             brand: "Samsung",         category: "Phone" },
    { name: "Galaxy S21",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy A54",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy A34",              brand: "Samsung",         category: "Phone" },
    { name: "Galaxy Z Fold 5",         brand: "Samsung",         category: "Phone" },
    { name: "Galaxy Z Flip 5",         brand: "Samsung",         category: "Phone" },
    // Phones — Google
    { name: "Pixel 8 Pro",             brand: "Google",          category: "Phone" },
    { name: "Pixel 8",                 brand: "Google",          category: "Phone" },
    { name: "Pixel 7 Pro",             brand: "Google",          category: "Phone" },
    { name: "Pixel 7",                 brand: "Google",          category: "Phone" },
    { name: "Pixel 6 Pro",             brand: "Google",          category: "Phone" },
    { name: "Pixel 6",                 brand: "Google",          category: "Phone" },
    // Phones — OnePlus / Nothing / Motorola
    { name: "OnePlus 12",              brand: "OnePlus",         category: "Phone" },
    { name: "OnePlus 11",              brand: "OnePlus",         category: "Phone" },
    { name: "OnePlus 10 Pro",          brand: "OnePlus",         category: "Phone" },
    { name: "Nothing Phone (2)",       brand: "Nothing",         category: "Phone" },
    { name: "Nothing Phone (1)",       brand: "Nothing",         category: "Phone" },
    { name: "Edge 50 Pro",             brand: "Motorola",        category: "Phone" },
    { name: "Edge 40 Pro",             brand: "Motorola",        category: "Phone" },
    { name: "Moto G84",                brand: "Motorola",        category: "Phone" },
    // Phones — Xiaomi / Redmi
    { name: "Redmi Note 13 Pro",       brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 13",           brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 12",           brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 11 Pro",       brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 10 Pro",       brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 10 5G",        brand: "Xiaomi",          category: "Phone" },
    { name: "Redmi Note 9S",           brand: "Xiaomi",          category: "Phone" },
    { name: "Xiaomi 13 Pro",           brand: "Xiaomi",          category: "Phone" },
    { name: "Xiaomi 13",               brand: "Xiaomi",          category: "Phone" },
    // Phones — others
    { name: "P60 Pro",                 brand: "Huawei",          category: "Phone" },
    { name: "P50 Pro",                 brand: "Huawei",          category: "Phone" },
    { name: "Mate 50 Pro",             brand: "Huawei",          category: "Phone" },
    { name: "Nokia G60 5G",            brand: "Nokia",           category: "Phone" },
    { name: "Nokia XR21",              brand: "Nokia",           category: "Phone" },
    { name: "Xperia 1 V",              brand: "Sony",            category: "Phone" },
    { name: "Xperia 5 V",              brand: "Sony",            category: "Phone" },
    { name: "Xperia 10 V",             brand: "Sony",            category: "Phone" },
    { name: "Find X6 Pro",             brand: "Oppo",            category: "Phone" },
    { name: "Reno 10 Pro",             brand: "Oppo",            category: "Phone" },
    { name: "Magic5 Pro",              brand: "Honor",           category: "Phone" },
    { name: "Fairphone 5",             brand: "Fairphone",       category: "Phone" },
    { name: "Fairphone 4",             brand: "Fairphone",       category: "Phone" },
    // Laptops
    { name: "MacBook Pro 16\" M3 Max", brand: "Apple",           category: "Laptop" },
    { name: "MacBook Pro 16\" M3 Pro", brand: "Apple",           category: "Laptop" },
    { name: "MacBook Pro 14\" M3 Max", brand: "Apple",           category: "Laptop" },
    { name: "MacBook Pro 14\" M3 Pro", brand: "Apple",           category: "Laptop" },
    { name: "MacBook Air 15\" M3",     brand: "Apple",           category: "Laptop" },
    { name: "MacBook Air 13\" M3",     brand: "Apple",           category: "Laptop" },
    { name: "MacBook Air 15\" M2",     brand: "Apple",           category: "Laptop" },
    { name: "MacBook Air 13\" M2",     brand: "Apple",           category: "Laptop" },
    { name: "MacBook Air 13\" M1",     brand: "Apple",           category: "Laptop" },
    { name: "XPS 15 (2024)",           brand: "Dell",            category: "Laptop" },
    { name: "XPS 13 (2024)",           brand: "Dell",            category: "Laptop" },
    { name: "Inspiron 15",             brand: "Dell",            category: "Laptop" },
    { name: "ThinkPad X1 Carbon Gen 12", brand: "Lenovo",        category: "Laptop" },
    { name: "ThinkPad T14s Gen 5",     brand: "Lenovo",          category: "Laptop" },
    { name: "IdeaPad Slim 5",          brand: "Lenovo",          category: "Laptop" },
    { name: "Legion 5i Gen 9",         brand: "Lenovo",          category: "Laptop" },
    { name: "Spectre x360 14",         brand: "HP",              category: "Laptop" },
    { name: "EliteBook 840 G11",       brand: "HP",              category: "Laptop" },
    { name: "Pavilion 15",             brand: "HP",              category: "Laptop" },
    { name: "ZenBook 14 OLED",         brand: "ASUS",            category: "Laptop" },
    { name: "ROG Zephyrus G14 2024",   brand: "ASUS",            category: "Laptop" },
    { name: "Surface Pro 11",          brand: "Microsoft",       category: "Laptop" },
    { name: "Surface Pro 10",          brand: "Microsoft",       category: "Laptop" },
    { name: "Surface Laptop 5",        brand: "Microsoft",       category: "Laptop" },
    // Consoles
    { name: "PS5 Disc Edition",        brand: "Sony PlayStation", category: "Console" },
    { name: "PS5 Digital Edition",     brand: "Sony PlayStation", category: "Console" },
    { name: "PS4 Pro",                 brand: "Sony PlayStation", category: "Console" },
    { name: "PS4 Slim",                brand: "Sony PlayStation", category: "Console" },
    { name: "PS4",                     brand: "Sony PlayStation", category: "Console" },
    { name: "Xbox Series X",           brand: "Microsoft Xbox",  category: "Console" },
    { name: "Xbox Series S",           brand: "Microsoft Xbox",  category: "Console" },
    { name: "Xbox One X",              brand: "Microsoft Xbox",  category: "Console" },
    { name: "Xbox One S",              brand: "Microsoft Xbox",  category: "Console" },
    { name: "Nintendo Switch OLED",    brand: "Nintendo",        category: "Console" },
    { name: "Nintendo Switch (V2)",    brand: "Nintendo",        category: "Console" },
    { name: "Nintendo Switch Lite",    brand: "Nintendo",        category: "Console" },
    // Tablets
    { name: "iPad Pro 13\" M4",        brand: "Apple",           category: "Tablet" },
    { name: "iPad Pro 11\" M4",        brand: "Apple",           category: "Tablet" },
    { name: "iPad Air 13\" M2",        brand: "Apple",           category: "Tablet" },
    { name: "iPad Air 11\" M2",        brand: "Apple",           category: "Tablet" },
    { name: "iPad mini 7th Gen",       brand: "Apple",           category: "Tablet" },
    { name: "iPad Pro 13\" M2",        brand: "Apple",           category: "Tablet" },
    { name: "iPad Pro 11\" M2",        brand: "Apple",           category: "Tablet" },
    { name: "iPad Air 5th Gen",        brand: "Apple",           category: "Tablet" },
    { name: "iPad 10th Gen",           brand: "Apple",           category: "Tablet" },
    { name: "iPad 9th Gen",            brand: "Apple",           category: "Tablet" },
    { name: "Galaxy Tab S10 Ultra",    brand: "Samsung",         category: "Tablet" },
    { name: "Galaxy Tab S10+",         brand: "Samsung",         category: "Tablet" },
    { name: "Galaxy Tab S10",          brand: "Samsung",         category: "Tablet" },
    { name: "Galaxy Tab S9 Ultra",     brand: "Samsung",         category: "Tablet" },
    { name: "Galaxy Tab S9+",          brand: "Samsung",         category: "Tablet" },
    { name: "Galaxy Tab S9",           brand: "Samsung",         category: "Tablet" },
    // Smartwatches
    { name: "Apple Watch Ultra 2",     brand: "Apple",           category: "Smartwatch" },
    { name: "Apple Watch Series 9",    brand: "Apple",           category: "Smartwatch" },
    { name: "Apple Watch Series 8",    brand: "Apple",           category: "Smartwatch" },
    { name: "Apple Watch SE 2nd Gen",  brand: "Apple",           category: "Smartwatch" },
    { name: "Galaxy Watch 6 Classic",  brand: "Samsung",         category: "Smartwatch" },
    { name: "Galaxy Watch 6",          brand: "Samsung",         category: "Smartwatch" },
    { name: "Galaxy Watch 5 Pro",      brand: "Samsung",         category: "Smartwatch" },
    { name: "Fitbit Sense 2",          brand: "Fitbit",          category: "Smartwatch" },
    { name: "Fitbit Versa 4",          brand: "Fitbit",          category: "Smartwatch" },
    // Audio
    { name: "AirPods Max",             brand: "Apple",           category: "Audio" },
    { name: "AirPods Pro 2",           brand: "Apple",           category: "Audio" },
    { name: "AirPods Pro",             brand: "Apple",           category: "Audio" },
    { name: "AirPods 3rd Gen",         brand: "Apple",           category: "Audio" },
    { name: "WH-1000XM5",              brand: "Sony",            category: "Audio" },
    { name: "WF-1000XM5",              brand: "Sony",            category: "Audio" },
    { name: "WH-1000XM4",              brand: "Sony",            category: "Audio" },
    { name: "QuietComfort Ultra",      brand: "Bose",            category: "Audio" },
    { name: "QuietComfort Earbuds II", brand: "Bose",            category: "Audio" },
];

async function seedTradeInDevices() {
    let created = 0;
    for (const device of TRADE_IN_SEED) {
        await prisma.tradeInDevice.upsert({
            where:  { brand_name: { brand: device.brand, name: device.name } },
            update: {},
            create: { ...device, isActive: true },
        });
        created++;
    }
    console.log(`✓ Trade-in search devices seeded (${created} devices)`);
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
    await seedGradeBanners();  // grade guide images (NEW/A/B/C/F)
    await seedPromoSlides();   // promo carousel from slides.json
    await seedStores();        // TechStop retail stores
    await seedHelplines();     // Store Helpline numbers

    const catalogIdMap = await seedDeviceCatalog(productsData);
    await seedProducts(productsData, catalogIdMap);
    await seedOtherProducts();
    await seedTradeInDevices();

    console.log('\nSeed complete.');
}

main()
    .catch(e => { console.error('Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });


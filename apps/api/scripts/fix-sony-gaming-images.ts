import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL
    ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter } as any);

const bucketName = process.env.GARAGE_BUCKET || 'ai-ecommerce';
const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
    credentials: {
        accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
});

function isImageFile(name: string): boolean {
    return /\.(jpg|jpeg|png|webp)$/i.test(name);
}

async function uploadLocalFile(localPath: string, s3Key: string): Promise<string | null> {
    if (!fs.existsSync(localPath)) return null;
    const buffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
               : ext === '.png' ? 'image/png'
               : ext === '.webp' ? 'image/webp'
               : 'application/octet-stream';

    await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: buffer, ContentType: mime }));

    try {
        await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: s3Key }));
    } catch (err) {
        console.warn(`Upload of ${s3Key} reported success but object is not retrievable`);
        return null;
    }
    return s3Key;
}

// The one-off Consoles->Gaming category merge deleted the old, image-populated
// Consoles-Sony BrandCategory row after moving its DeviceCatalogs onto the surviving
// Gaming-Sony row — but never copied its `images` array over first, leaving the
// surviving row's brand-category gallery empty. Backfill it from the same local seed
// source images the original seeding used (folder was `categories/consoles/sony[playstation]`,
// now renamed to `categories/gaming/sony[playstation]`).
async function main() {
    const gaming = await prisma.category.findFirst({ where: { name: 'Gaming' } });
    if (!gaming) throw new Error('Gaming category not found');

    const sony = await prisma.brand.findFirst({ where: { slug: 'sony' } });
    if (!sony) throw new Error('Sony brand not found');

    const bc = await prisma.brandCategory.findUnique({
        where: { brandId_categoryId: { brandId: sony.id, categoryId: gaming.id } },
    });
    if (!bc) throw new Error('Sony/Gaming BrandCategory not found');

    if (bc.images.length > 0) {
        console.log(`Sony/Gaming BrandCategory already has ${bc.images.length} image(s) — nothing to do.`);
        return;
    }

    const brandDir = path.join(__dirname, '..', 'prisma', 'seed', 'categories', 'gaming', 'sony[playstation]');
    const imgs = fs.readdirSync(brandDir).filter(isImageFile);
    const keys: string[] = [];
    for (const img of imgs) {
        const s3Key = `catalog/categories/consoles/playstation/${img}`;
        const uploaded = await uploadLocalFile(path.join(brandDir, img), s3Key);
        if (uploaded) keys.push(uploaded);
    }

    if (keys.length === 0) {
        console.log('No images uploaded — nothing to update.');
        return;
    }

    await prisma.brandCategory.update({
        where: { id: bc.id },
        data: { images: keys, alias: bc.alias ?? 'playstation' },
    });
    console.log(`Uploaded and assigned ${keys.length} image(s) to Sony/Gaming BrandCategory:`, keys);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

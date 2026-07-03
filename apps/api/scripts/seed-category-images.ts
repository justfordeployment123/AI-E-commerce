import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

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
        accessKeyId:     process.env.GARAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
});

const SEED_DIR = path.join(__dirname, '../prisma/seed');
const CAT_DIR  = path.join(SEED_DIR, 'categories');
const isImage  = (f: string) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f);

async function uploadFile(localPath: string, s3Key: string): Promise<string> {
    const buffer      = fs.readFileSync(localPath);
    const contentType = (mime.lookup(localPath) as string) || 'application/octet-stream';
    await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: s3Key, Body: buffer, ContentType: contentType }));
    return s3Key;
}

async function main() {
    if (!fs.existsSync(CAT_DIR)) { console.log('No seed/categories folder'); return; }

    const catFolders = fs.readdirSync(CAT_DIR)
        .filter(d => fs.statSync(path.join(CAT_DIR, d)).isDirectory());

    for (const catSlug of catFolders) {
        const catPath    = path.join(CAT_DIR, catSlug);
        const imageFiles = fs.readdirSync(catPath)
            .filter(f => isImage(f) && fs.statSync(path.join(catPath, f)).isFile())
            .sort();

        if (imageFiles.length === 0) { console.log(`${catSlug}: no images`); continue; }

        const cat = await (prisma as any).category.findUnique({ where: { slug: catSlug } });
        if (!cat) { console.log(`${catSlug}: not in DB`); continue; }

        if ((cat.images as string[]).length > 0) {
            console.log(`${catSlug}: already has ${(cat.images as string[]).length} images — skipping`);
            continue;
        }

        const keys: string[] = [];
        for (const imgFile of imageFiles) {
            const key = await uploadFile(path.join(catPath, imgFile), `catalog/categories/${catSlug}/${imgFile}`);
            keys.push(key);
            console.log(`  ↑ ${imgFile}`);
        }

        await (prisma as any).category.update({
            where: { slug: catSlug },
            data:  { image: keys[0], images: keys },
        });
        console.log(`✓ ${catSlug}: ${keys.length} image(s) seeded`);
    }
}

main()
    .catch(e => { console.error(e.message); process.exit(1); })
    .finally(async () => { await (prisma as any).$disconnect(); await pool.end(); });

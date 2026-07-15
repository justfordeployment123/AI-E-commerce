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
    } catch {
        return null;
    }
    return s3Key;
}

// One-off repair: the 10 GradeBanner DB rows survived a local storage reset but their
// S3 objects didn't, and seedGradeBanners()'s old idempotency check trusted the DB row
// alone, so re-seeding never repaired them (fixed separately in seed.service.ts). This
// re-uploads every existing GradeBanner's file from the local seed source now.
async function main() {
    const gradeDir = path.join(__dirname, '..', 'prisma', 'seed', 'banners', 'Grade');
    const banners = await prisma.gradeBanner.findMany();
    let fixed = 0;
    for (const b of banners) {
        const filename = path.basename(b.key);
        const localPath = path.join(gradeDir, filename);
        const uploaded = await uploadLocalFile(localPath, b.key);
        if (uploaded) {
            console.log(`Repaired ${b.key}`);
            fixed++;
        } else {
            console.warn(`Failed to repair ${b.key} — local file missing or upload not retrievable`);
        }
    }
    console.log(`Repaired ${fixed}/${banners.length} grade banner(s)`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL
    ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter } as any);

async function main() {
    const result = await prisma.store.updateMany({
        data: {
            address: '148B Melton Rd',
            city: 'Leicester',
            postcode: 'LE4 5EE',
            phone: '+447343055398',
            mapsEmbedUrl: 'https://maps.google.com/maps?q=TechStop+Leicester&ftid=0x487761ad81f139e7:0x56323f6a6627c65e&t=&z=17&ie=UTF8&iwloc=&output=embed',
        },
    });
    console.log(`✓ Updated ${result.count} store(s)`);
}

main()
    .catch(e => { console.error(e.message); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

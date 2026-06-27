import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL
    ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
    const email = 'admin@techstop.co.uk';
    const password = 'password';
    const name = 'TechStop Admin';

    console.log(`Creating or updating admin user: ${email}...`);
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash,
            role: 'ADMIN',
            name,
        },
        create: {
            email,
            passwordHash,
            role: 'ADMIN',
            name,
        },
    });

    console.log('Admin user upserted successfully:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    });
}

main()
    .catch((e) => {
        console.error('Error creating admin user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

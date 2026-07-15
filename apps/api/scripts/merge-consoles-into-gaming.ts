import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL
    ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool    = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter } as any);

async function main() {
    const consoles = await prisma.category.findFirst({ where: { name: { equals: 'Consoles', mode: 'insensitive' } } });
    const gaming    = await prisma.category.findFirst({ where: { name: { equals: 'Gaming', mode: 'insensitive' } } });

    if (!consoles) {
        console.log('No "Consoles" category found — nothing to merge.');
        return;
    }
    if (!gaming) {
        // Nothing to merge into — just rename Consoles to Gaming in place.
        await prisma.category.update({ where: { id: consoles.id }, data: { name: 'Gaming' } });
        console.log('No "Gaming" category existed — renamed "Consoles" to "Gaming" in place.');
        return;
    }

    const consolesBrandCats = await prisma.brandCategory.findMany({
        where: { categoryId: consoles.id },
        include: { deviceCatalogs: true },
    });

    for (const bc of consolesBrandCats) {
        const targetBc = await prisma.brandCategory.findUnique({
            where: { brandId_categoryId: { brandId: bc.brandId, categoryId: gaming.id } },
        });

        if (!targetBc) {
            // No brand collision — just re-point this BrandCategory at Gaming.
            await prisma.brandCategory.update({ where: { id: bc.id }, data: { categoryId: gaming.id } });
            console.log(`Re-pointed BrandCategory ${bc.id} (brand ${bc.brandId}) -> Gaming`);
            continue;
        }

        // Brand collision: merge each DeviceCatalog under bc into targetBc.
        for (const dc of bc.deviceCatalogs) {
            const targetDc = await prisma.deviceCatalog.findUnique({
                where: { brandCategoryId_model: { brandCategoryId: targetBc.id, model: dc.model } },
            });

            if (!targetDc) {
                await prisma.deviceCatalog.update({ where: { id: dc.id }, data: { brandCategoryId: targetBc.id } });
                console.log(`Moved DeviceCatalog ${dc.id} (${dc.model}) -> BrandCategory ${targetBc.id}`);
                continue;
            }

            // Model collision too — reassign products onto the existing target DeviceCatalog, then drop the duplicate.
            const moved = await prisma.product.updateMany({
                where: { catalogId: dc.id },
                data: { catalogId: targetDc.id },
            });
            await prisma.deviceCatalog.delete({ where: { id: dc.id } });
            console.log(`Merged duplicate DeviceCatalog ${dc.id} (${dc.model}) into ${targetDc.id}, moved ${moved.count} product(s)`);
        }

        await prisma.brandCategory.delete({ where: { id: bc.id } });
        console.log(`Deleted now-empty BrandCategory ${bc.id} (brand ${bc.brandId} under Consoles)`);
    }

    // Consoles carries the real seeded displayName/description/images (from the earlier
    // categories seeding fix); Gaming's own fields are empty/stale — copy them over.
    await prisma.category.update({
        where: { id: gaming.id },
        data: {
            displayName:  consoles.displayName ?? gaming.displayName,
            description:  consoles.description ?? gaming.description,
            image:        consoles.image ?? gaming.image,
            images:       consoles.images.length ? consoles.images : gaming.images,
            isSellable:   consoles.isSellable || gaming.isSellable,
            isRepairable: consoles.isRepairable || gaming.isRepairable,
        },
    });

    await prisma.category.delete({ where: { id: consoles.id } });
    console.log('Deleted "Consoles" category. Merge complete.');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); await pool.end(); });

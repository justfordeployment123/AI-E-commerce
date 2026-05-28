import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';

export default defineConfig({
    schema: '../api/prisma/schema.prisma',
    migrations: {
        path: '../api/prisma/migrations',
    },
    datasource: {
        url: databaseUrl,
    },
});

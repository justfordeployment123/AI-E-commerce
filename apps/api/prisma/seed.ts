import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://ai_ecommerce:ai_ecommerce@localhost:5432/ai_ecommerce?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultPricingConfigs = [
    { key: 'margin_pct', value: 30.0, label: 'Default Profit Margin (%)' },
    { key: 'multiplier_mint', value: 1.0, label: 'Mint Condition Multiplier' },
    { key: 'multiplier_good', value: 0.85, label: 'Good Condition Multiplier' },
    { key: 'multiplier_used', value: 0.70, label: 'Used Condition Multiplier' },
    { key: 'multiplier_damaged', value: 0.40, label: 'Damaged Condition Multiplier' },
];

const devices = [
    // --- iPhones ---
    { brand: 'Apple', model: 'iPhone 11', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro', category: 'Phone', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 11 Pro Max', category: 'Phone', storageOptions: ['64GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Mini', category: 'Phone', storageOptions: ['64GB', '128GB', '256GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 12 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Mini', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 13 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Plus', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 14 Pro Max', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Plus', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'iPhone 15 Pro Max', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },

    // --- Samsung Galaxy ---
    { brand: 'Samsung', model: 'Galaxy S21 5G', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21+ 5G', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S21 Ultra 5G', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S22', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22+', category: 'Phone', storageOptions: ['128GB', '256GB'] },
    { brand: 'Samsung', model: 'Galaxy S22 Ultra', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S23', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23+', category: 'Phone', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S23 Ultra', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Samsung', model: 'Galaxy S24', category: 'Phone', storageOptions: ['128GB', '256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24+', category: 'Phone', storageOptions: ['256GB', '512GB'] },
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', category: 'Phone', storageOptions: ['256GB', '512GB', '1TB'] },

    // --- iPads ---
    { brand: 'Apple', model: 'iPad 9th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad 10th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Air 5th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Mini 6th Gen', category: 'Tablet', storageOptions: ['64GB', '256GB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M1', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 11-inch M2', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M1', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'iPad Pro 12.9-inch M2', category: 'Tablet', storageOptions: ['128GB', '256GB', '512GB', '1TB', '2TB'] },

    // --- PlayStations ---
    { brand: 'Sony', model: 'PlayStation 3 Slim', category: 'Console', storageOptions: ['120GB', '250GB', '320GB', '500GB'] },
    { brand: 'Sony', model: 'PlayStation 4', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Slim', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 4 Pro', category: 'Console', storageOptions: ['1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Disc Edition', category: 'Console', storageOptions: ['825GB', '1TB'] },
    { brand: 'Sony', model: 'PlayStation 5 Digital Edition', category: 'Console', storageOptions: ['825GB', '1TB'] },

    // --- Xboxes ---
    { brand: 'Microsoft', model: 'Xbox 360 Slim', category: 'Console', storageOptions: ['4GB', '250GB', '320GB'] },
    { brand: 'Microsoft', model: 'Xbox One', category: 'Console', storageOptions: ['500GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox One S', category: 'Console', storageOptions: ['500GB', '1TB', '2TB'] },
    { brand: 'Microsoft', model: 'Xbox One X', category: 'Console', storageOptions: ['1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series S', category: 'Console', storageOptions: ['512GB', '1TB'] },
    { brand: 'Microsoft', model: 'Xbox Series X', category: 'Console', storageOptions: ['1TB'] },

    // --- MacBooks ---
    { brand: 'Apple', model: 'MacBook Air M1 (2020)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB'] },
    { brand: 'Apple', model: 'MacBook Air M2 (2022)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 13-inch M1 (2020)', category: 'Laptop', storageOptions: ['256GB', '512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 14-inch M2 Pro (2023)', category: 'Laptop', storageOptions: ['512GB', '1TB', '2TB'] },
    { brand: 'Apple', model: 'MacBook Pro 16-inch M3 Max (2023)', category: 'Laptop', storageOptions: ['1TB', '2TB', '4TB'] },
];

const imagesMap = {
    Phone: [
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565849904461-04a58ad37a28?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
    ],
    Tablet: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=800&q=80',
    ],
    Laptop: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
    ],
    Console: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1621259182978-f09e5e2ae090?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=800&q=80',
    ],
    Accessories: [
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    ]
};

// Base descriptions generator
function getProductDescription(brand: string, model: string, condition: string): string {
    return `This professional refurbished ${brand} ${model} is graded in ${condition} condition. Thoroughly tested by our in-house technicians, it is 100% functional and comes with a 12-month warranty, charging accessories, and free delivery in the UK. Superb value for money.`;
}

// Pricing generator for seeding products (E-Commerce Sell Side)
function getBasePrice(category: string, model: string): number {
    if (category === 'Phone') {
        if (model.includes('15 Pro')) return 899;
        if (model.includes('15')) return 649;
        if (model.includes('14 Pro')) return 749;
        if (model.includes('14')) return 549;
        if (model.includes('13 Pro')) return 629;
        if (model.includes('13')) return 459;
        if (model.includes('12')) return 349;
        if (model.includes('11')) return 249;
        if (model.includes('S24 Ultra')) return 949;
        if (model.includes('S24')) return 699;
        if (model.includes('S23 Ultra')) return 799;
        if (model.includes('S23')) return 549;
        if (model.includes('S22')) return 399;
        if (model.includes('S21')) return 279;
        return 299;
    }
    if (category === 'Tablet') {
        if (model.includes('Pro 12.9')) return 799;
        if (model.includes('Pro 11')) return 649;
        if (model.includes('Air')) return 449;
        if (model.includes('Mini')) return 349;
        return 229; // standard iPad 9th/10th gen
    }
    if (category === 'Laptop') {
        if (model.includes('M3 Max')) return 2499;
        if (model.includes('M2 Pro')) return 1699;
        if (model.includes('Pro 13-inch M1')) return 899;
        if (model.includes('Air M2')) return 999;
        return 699; // Air M1
    }
    if (category === 'Console') {
        if (model.includes('PlayStation 5') || model.includes('Xbox Series X')) return 389;
        if (model.includes('Xbox Series S')) return 189;
        if (model.includes('PlayStation 4 Pro') || model.includes('Xbox One X')) return 149;
        if (model.includes('PlayStation 4') || model.includes('Xbox One')) return 99;
        return 49; // PS3 / Xbox 360
    }
    return 39;
}

// Generate products array
function generateProducts() {
    const productsList: any[] = [];
    const conditions = ['Mint', 'Good', 'Refurbished'] as const;
    
    // Seed e-commerce items derived from the devices
    devices.forEach((dev, idx) => {
        // Pick one or two conditions for each model to simulate variety in the store
        const selectedConditions = idx % 2 === 0 
            ? [conditions[0], conditions[2]] 
            : [conditions[1]];
        const imgs = imagesMap[dev.category as keyof typeof imagesMap] || [];
        
        selectedConditions.forEach(cond => {
            const basePrice = getBasePrice(dev.category, dev.model);
            
            // Adjust price based on condition
            let price = basePrice;
            if (cond === 'Good') price = Math.round(basePrice * 0.85);
            if (cond === 'Refurbished') price = Math.round(basePrice * 0.75);
            
            const storage = dev.storageOptions[idx % dev.storageOptions.length] ?? '128GB';
            const name = `${dev.brand} ${dev.model} ${storage} (${cond})`;
            const slug = `${dev.brand.toLowerCase()}-${dev.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${storage.toLowerCase()}-${cond.toLowerCase()}-${idx}`;
            
            productsList.push({
                name,
                slug,
                category: dev.category === 'Laptop' ? 'Laptops / MacBooks' : (dev.category === 'Phone' ? 'Phones' : (dev.category === 'Tablet' ? 'Tablets' : 'Consoles')),
                brand: dev.brand,
                model: dev.model,
                condition: cond,
                price: price,
                comparePrice: Math.round(price * 1.2),
                stock: Math.floor(Math.random() * 8) + 2, // 2 to 9 items in stock
                images: [imgs[idx % imgs.length], imgs[(idx + 1) % imgs.length]].filter(Boolean),
                specs: {
                    Storage: storage,
                    Brand: dev.brand,
                    Model: dev.model,
                    Color: ['Space Grey', 'Silver', 'Phantom Black', 'Midnight', 'White'][idx % 5],
                    Warranty: '12 Months'
                },
                description: getProductDescription(dev.brand, dev.model, cond),
                rating: 4 + Math.random() * 1,
                reviewCount: Math.floor(Math.random() * 50) + 5,
                isActive: true
            });
        });
    });

    // Also add a few accessories specifically for the Accessories category
    const accessories = [
        { brand: 'Apple', model: '20W USB-C Power Adapter', name: 'Apple 20W USB-C Power Adapter', price: 19 },
        { brand: 'Apple', model: 'MagSafe Charger', name: 'Apple MagSafe Charger', price: 39 },
        { brand: 'Sony', model: 'DualSense Wireless Controller', name: 'Sony DualSense Wireless Controller (PS5)', price: 59 },
        { brand: 'Microsoft', model: 'Xbox Wireless Controller', name: 'Microsoft Xbox Wireless Controller', price: 54 },
        { brand: 'Apple', model: 'Pencil 2nd Gen', name: 'Apple Pencil (2nd Generation)', price: 99 },
    ];

    accessories.forEach((acc, idx) => {
        const imgs = imagesMap['Accessories'] || [];
        const slug = `accessory-${acc.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`;
        productsList.push({
            name: acc.name,
            slug,
            category: 'Accessories',
            brand: acc.brand,
            model: acc.model,
            condition: 'Mint',
            price: acc.price,
            comparePrice: Math.round(acc.price * 1.15),
            stock: 15,
            images: [imgs[idx % imgs.length]].filter(Boolean),
            specs: {
                Brand: acc.brand,
                Model: acc.model,
                Warranty: '12 Months'
            },
            description: `Brand new or like-new premium accessory: ${acc.name}. Fully tested and 100% compatible.`,
            rating: 4.5 + Math.random() * 0.5,
            reviewCount: Math.floor(Math.random() * 120) + 10,
            isActive: true
        });
    });

    return productsList;
}

async function main() {
    console.log('Starting database seeding...');

    // 1. Clear existing database tables
    console.log('Clearing old data...');
    await prisma.pricingConfig.deleteMany({});
    await prisma.deviceCatalog.deleteMany({});
    await prisma.product.deleteMany({});

    // 2. Seed Pricing Configurations
    console.log('Seeding pricing configurations...');
    for (const config of defaultPricingConfigs) {
        await prisma.pricingConfig.create({
            data: config,
        });
    }

    // 3. Seed Device Catalog (Trade-In Database)
    console.log('Seeding device catalog...');
    for (const dev of devices) {
        await prisma.deviceCatalog.create({
            data: {
                brand: dev.brand,
                model: dev.model,
                category: dev.category,
                storageOptions: dev.storageOptions,
                isActive: true,
            },
        });
    }

    // 4. Seed E-Commerce Products
    console.log('Seeding e-commerce products...');
    const products = generateProducts();
    for (const prod of products) {
        await prisma.product.create({
            data: prod,
        });
    }

    console.log(`Seeding complete!`);
    console.log(`- Seeded ${defaultPricingConfigs.length} pricing configurations.`);
    console.log(`- Seeded ${devices.length} devices in the trade-in catalog.`);
    console.log(`- Seeded ${products.length} products in the e-commerce store.`);
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

import * as fs from 'fs';
import * as path from 'path';

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

const accessories = [
    { brand: 'Apple', model: '20W USB-C Power Adapter', name: 'Apple 20W USB-C Power Adapter', price: 19 },
    { brand: 'Apple', model: 'MagSafe Charger', name: 'Apple MagSafe Charger', price: 39 },
    { brand: 'Sony', model: 'DualSense Wireless Controller', name: 'Sony DualSense Wireless Controller (PS5)', price: 59 },
    { brand: 'Microsoft', model: 'Xbox Wireless Controller', name: 'Microsoft Xbox Wireless Controller', price: 54 },
    { brand: 'Apple', model: 'Pencil 2nd Gen', name: 'Apple Pencil (2nd Generation)', price: 99 },
];

const fallbackImages = {
    Phone: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80',
    Tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    Laptop: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
    Console: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    Accessories: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
};

function getProductDescription(brand: string, model: string, condition: string): string {
    return `This professional refurbished ${brand} ${model} is graded in ${condition} condition. Thoroughly tested by our in-house technicians, it is 100% functional and comes with a 12-month warranty, charging accessories, and free delivery in the UK. Superb value for money.`;
}

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
        return 229;
    }
    if (category === 'Laptop') {
        if (model.includes('M3 Max')) return 2499;
        if (model.includes('M2 Pro')) return 1699;
        if (model.includes('Pro 13-inch M1')) return 899;
        if (model.includes('Air M2')) return 999;
        return 699;
    }
    if (category === 'Console') {
        if (model.includes('PlayStation 5') || model.includes('Xbox Series X')) return 389;
        if (model.includes('Xbox Series S')) return 189;
        if (model.includes('PlayStation 4 Pro') || model.includes('Xbox One X')) return 149;
        if (model.includes('PlayStation 4') || model.includes('Xbox One')) return 99;
        return 49;
    }
    return 39;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Generate products array
function generateProducts() {
    const productsList: any[] = [];
    const conditions = ['Mint', 'Good', 'Refurbished'] as const;
    let globalIndex = 0;
    
    // 1. Devices seeding
    devices.forEach((dev, idx) => {
        const selectedConditions = idx % 2 === 0 ? [conditions[0], conditions[2]] : [conditions[1]];
        
        selectedConditions.forEach((cond) => {
            const basePrice = getBasePrice(dev.category, dev.model);
            let price = basePrice;
            if (cond === 'Good') price = Math.round(basePrice * 0.85);
            if (cond === 'Refurbished') price = Math.round(basePrice * 0.75);
            
            const storage = dev.storageOptions[idx % dev.storageOptions.length] ?? '128GB';
            const name = `${dev.brand} ${dev.model} ${storage} (${cond})`;
            const slug = `${dev.brand.toLowerCase()}-${dev.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${storage.toLowerCase()}-${cond.toLowerCase()}-${globalIndex}`;
            
            const slugifiedModel = slugify(`${dev.brand} ${dev.model}`);
            const imageFilename = `${slugifiedModel}.jpg`;
            
            productsList.push({
                name,
                slug,
                category: dev.category === 'Laptop' ? 'Laptops / MacBooks' : (dev.category === 'Phone' ? 'Phones' : (dev.category === 'Tablet' ? 'Tablets' : 'Consoles')),
                brand: dev.brand,
                model: dev.model,
                condition: cond,
                price: price,
                comparePrice: Math.round(price * 1.2),
                stock: Math.floor(Math.random() * 8) + 2,
                imageFilename,
                specs: {
                    Storage: storage,
                    Brand: dev.brand,
                    Model: dev.model,
                    Color: ['Space Grey', 'Silver', 'Phantom Black', 'Midnight', 'White'][idx % 5],
                    Warranty: '12 Months'
                },
                description: getProductDescription(dev.brand, dev.model, cond),
                rating: Number((4 + Math.random() * 1).toFixed(2)),
                reviewCount: Math.floor(Math.random() * 50) + 5,
                isActive: true
            });
            globalIndex++;
        });
    });

    // 2. Accessories seeding
    accessories.forEach((acc, idx) => {
        const slugifiedModel = slugify(`${acc.brand} ${acc.model}`);
        const imageFilename = `${slugifiedModel}.jpg`;
        const slug = `accessory-${acc.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${globalIndex}`;
        
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
            imageFilename,
            specs: {
                Brand: acc.brand,
                Model: acc.model,
                Warranty: '12 Months'
            },
            description: `Brand new or like-new premium accessory: ${acc.name}. Fully tested and 100% compatible.`,
            rating: Number((4.5 + Math.random() * 0.5).toFixed(2)),
            reviewCount: Math.floor(Math.random() * 120) + 10,
            isActive: true
        });
        globalIndex++;
    });

    return productsList;
}

// Fetch real device image URLs from DuckDuckGo image search
async function getDdgImages(query: string): Promise<string[]> {
    try {
        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const body = await res.text();
        const vqdMatch = body.match(/vqd=['"]?([\d-]+)['"]?/);
        if (!vqdMatch) return [];
        
        const vqd = vqdMatch[1];
        const jsonUrl = `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&p=-1`;
        
        const jsonRes = await fetch(jsonUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const data = await jsonRes.json() as { results?: Array<{ image?: string }> };
        if (data.results && data.results.length > 0) {
            return data.results
                .map(r => r.image)
                .filter((img): img is string => !!img && img.startsWith('http'));
        }
        return [];
    } catch (e) {
        return [];
    }
}

// Download image from URL to local disk
async function downloadImage(url: string, localPath: string): Promise<void> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(localPath, buffer);
}

// Sleep utility to prevent DDG rate limit
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('--- Generating Local E-Commerce Product Catalog with Real Device Photos ---');

    // Clean up old downloads folder to delete previous run's files
    const downloadDir = path.join(__dirname, 'downloads');
    if (fs.existsSync(downloadDir)) {
        console.log(`Cleaning old downloads directory: ${downloadDir}`);
        fs.rmSync(downloadDir, { recursive: true, force: true });
    }
    fs.mkdirSync(downloadDir, { recursive: true });

    const products = generateProducts();
    
    // Determine unique models to download exactly one unique image per device model
    const uniqueModels = new Map<string, { brand: string; model: string; category: string; filename: string }>();
    products.forEach(p => {
        const uniqueKey = `${p.brand} ${p.model}`;
        if (!uniqueModels.has(uniqueKey)) {
            uniqueModels.set(uniqueKey, {
                brand: p.brand,
                model: p.model,
                category: p.category === 'Laptops / MacBooks' ? 'Laptop' : (p.category === 'Phones' ? 'Phone' : (p.category === 'Tablets' ? 'Tablet' : (p.category === 'Accessories' ? 'Accessories' : 'Console'))),
                filename: p.imageFilename
            });
        }
    });

    console.log(`Identified ${uniqueModels.size} unique device models in catalog.`);
    console.log('Starting dynamic image searches and downloads with content deduplication...');

    const downloadedUrls = new Set<string>();
    const modelsList = Array.from(uniqueModels.values());
    let successCount = 0;

    for (let i = 0; i < modelsList.length; i++) {
        const item = modelsList[i]!;
        const query = `${item.brand} ${item.model} product photo transparent background png`;
        const localPath = path.join(downloadDir, item.filename);
        
        console.log(`[${i + 1}/${modelsList.length}] Searching DuckDuckGo for: "${query}"...`);
        
        // Try searching for unique URLs
        let imageUrl: string | null = null;
        let urls = await getDdgImages(query);
        
        // Find first image URL that hasn't been downloaded for another model
        for (const u of urls) {
            if (!downloadedUrls.has(u)) {
                imageUrl = u;
                break;
            }
        }
        
        // Fallback to first search result if all are duplicates
        if (!imageUrl && urls.length > 0) {
            imageUrl = urls[0] ?? null;
        }

        // Retry with simpler query if still nothing
        if (!imageUrl) {
            const simpleQuery = `${item.brand} ${item.model} device photo`;
            console.log(`  Query failed. Retrying with: "${simpleQuery}"...`);
            const simpleUrls = await getDdgImages(simpleQuery);
            for (const u of simpleUrls) {
                if (!downloadedUrls.has(u)) {
                    imageUrl = u;
                    break;
                }
            }
            if (!imageUrl && simpleUrls.length > 0) {
                imageUrl = simpleUrls[0] ?? null;
            }
        }

        let downloadSuccess = false;
        if (imageUrl) {
            try {
                console.log(`  Selected unique image URL: ${imageUrl}`);
                console.log(`  Downloading to: ${item.filename}...`);
                await downloadImage(imageUrl, localPath);
                downloadSuccess = true;
                downloadedUrls.add(imageUrl);
                successCount++;
            } catch (e: any) {
                console.error(`  [ERROR] Download failed: ${e.message}`);
            }
        } else {
            console.error(`  [ERROR] No image URL found on search engines.`);
        }

        // Fallback to high quality static Unsplash category image if everything fails
        if (!downloadSuccess) {
            const fallbackUrl = fallbackImages[item.category as keyof typeof fallbackImages];
            console.log(`  Using high quality placeholder fallback: ${fallbackUrl}`);
            try {
                await downloadImage(fallbackUrl, localPath);
                console.log(`  Successfully saved fallback to: ${item.filename}`);
            } catch (e: any) {
                console.error(`  [ERROR] Fallback download failed: ${e.message}`);
            }
        }

        // Wait 1.5 seconds between requests to avoid rate limits
        await sleep(1500);
    }

    // 2. Format products JSON array mapping images to the local file names
    console.log('Formatting products JSON catalog...');
    const formattedProducts = products.map(prod => {
        const { imageFilename, ...rest } = prod;
        return {
            ...rest,
            images: [imageFilename] // References the exact file in the downloads folder
        };
    });

    const jsonPath = path.join(downloadDir, 'products.json');
    console.log(`Writing product metadata JSON to: ${jsonPath}`);
    fs.writeFileSync(jsonPath, JSON.stringify(formattedProducts, null, 2), 'utf-8');

    console.log('\n--- Seeding Process Completed ---');
    console.log(`- Downloaded ${successCount} unique device pictures from search engines.`);
    console.log(`- Created products JSON listing for ${formattedProducts.length} items in: apps/api/prisma/downloads/products.json`);
}

main().catch(console.error);

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';

// Load environment variables from apps/api/.env using process.cwd()
dotenv.config({ path: path.join(process.cwd(), 'apps/api/.env') });

declare const document: any;

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
const prisma = new PrismaClient({
    adapter: new PrismaPg(
        new Pool({
            connectionString,
            connectionTimeoutMillis: 2000,
        })
    ),
});

interface CompetitorPrices {
    sellPrice: number | null;
    buyCashPrice?: number | null;
    buyExchangePrice?: number | null;
}

interface DevicePrices {
    cex: CompetitorPrices | null;
    backMarket: CompetitorPrices | null;
    musicMagpie: CompetitorPrices | null;
}

function parsePrice(text: string): number | null {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

function extractFirstPrice(text: string): number | null {
    const match = text.match(/£\s*(\d+(?:\.\d{2})?)/);
    if (match && match[1]) {
        const val = parseFloat(match[1]);
        return isNaN(val) ? null : val;
    }
    return null;
}

async function scrapeCeX(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
    const page = await context.newPage();
    try {
        const cexSearchUrl = `https://uk.webuy.com/search?stext=${encodeURIComponent(query)}`;
        console.log(`[CeX] Navigating: ${cexSearchUrl}`);
        await page.goto(cexSearchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

        // Wait for product cards to load dynamically
        try {
            await page.waitForSelector('.search-product-card', { timeout: 20000 });
        } catch (e) {
            console.log(`[CeX] Timed out waiting for cards to load for "${query}". Skeletons might still be present or page has no results.`);
            return null;
        }

        // Accept cookies
        try {
            const acceptBtn = await page.$('#onetrust-accept-btn-handler');
            if (acceptBtn) {
                await acceptBtn.click();
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) {}

        const cardData = await page.evaluate((storageVal) => {
            const cards = Array.from(document.querySelectorAll('.search-product-card')) as any[];
            
            // Try to find Unlocked variant first
            let matchedCard = cards.find(card => {
                const text = card.textContent?.toLowerCase() || '';
                const hasStorage = !storageVal || text.includes(storageVal.toLowerCase());
                return hasStorage && text.includes('unlocked');
            });

            // Fallback to any card matching storage
            if (!matchedCard) {
                matchedCard = cards.find(card => {
                    const text = card.textContent?.toLowerCase() || '';
                    return !storageVal || text.includes(storageVal.toLowerCase());
                });
            }

            if (!matchedCard) return null;

            const priceEl = matchedCard.querySelector('.product-main-price');
            const titleEl = matchedCard.querySelector('a.line-clamp');

            return {
                title: titleEl?.textContent?.trim() || null,
                priceText: priceEl?.textContent?.trim() || null
            };
        }, storage);

        if (!cardData || !cardData.priceText) {
            console.log(`[CeX] No matching card found for "${query}"`);
            return null;
        }

        const sellPrice = parsePrice(cardData.priceText);
        console.log(`[CeX] Found matched product: "${cardData.title}" - Sell Price: £${sellPrice}`);

        // Try toggling trade-in prices
        let buyCashPrice: number | null = null;
        let buyExchangePrice: number | null = null;

        try {
            const toggled = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*')) as any[];
                const toggleText = elements.find(el => el.textContent?.trim() === 'Show trade-in prices:');
                if (toggleText) {
                    const parent = toggleText.parentElement;
                    const inputOrButton = parent?.querySelector('input, button, span, label') as any;
                    if (inputOrButton) {
                        inputOrButton.click();
                        return true;
                    }
                }
                return false;
            });

            if (toggled) {
                await new Promise(r => setTimeout(r, 2500));
                
                const cardDataAfter = await page.evaluate((storageVal) => {
                    const cards = Array.from(document.querySelectorAll('.search-product-card')) as any[];
                    
                    let matchedCard = cards.find(card => {
                        const text = card.textContent?.toLowerCase() || '';
                        const hasStorage = !storageVal || text.includes(storageVal.toLowerCase());
                        return hasStorage && text.includes('unlocked');
                    });

                    if (!matchedCard) {
                        matchedCard = cards.find(card => {
                            const text = card.textContent?.toLowerCase() || '';
                            return !storageVal || text.includes(storageVal.toLowerCase());
                        });
                    }

                    if (!matchedCard) return null;

                    const priceWrapper = matchedCard.querySelector('.product-prices');
                    const texts = priceWrapper ? Array.from(priceWrapper.querySelectorAll('p, span')).map((el: any) => el.textContent?.trim() || '').filter(Boolean) : [];
                    return { texts };
                }, storage);

                if (cardDataAfter && cardDataAfter.texts.length > 0) {
                    for (const text of cardDataAfter.texts) {
                        if (text.toLowerCase().includes('cash')) {
                            buyCashPrice = extractFirstPrice(text);
                        }
                        if (text.toLowerCase().includes('exchange')) {
                            buyExchangePrice = extractFirstPrice(text);
                        }
                    }
                    console.log(`[CeX] Extracted Trade-In - Cash: £${buyCashPrice}, Exchange: £${buyExchangePrice}`);
                }
            }
        } catch (e: any) {
            console.log(`[CeX] Trade-In toggle failed: ${e.message}`);
        }

        return {
            sellPrice,
            buyCashPrice,
            buyExchangePrice
        };
    } catch (e: any) {
        console.error(`[CeX] Error scraping "${query}":`, e.message);
        return null;
    } finally {
        await page.close();
    }
}

async function scrapeBackMarket(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
    const page = await context.newPage();
    try {
        const bmSearchUrl = `https://www.backmarket.co.uk/en-gb/search?q=${encodeURIComponent(query)}`;
        console.log(`[BackMarket] Navigating: ${bmSearchUrl}`);
        await page.goto(bmSearchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        if (title.includes('Cloudflare') || title.includes('Just a moment') || title.includes('Verify you are human')) {
            console.log(`[BackMarket] Blocked by Cloudflare Turnstile for "${query}"`);
            return null;
        }

        const priceText = await page.evaluate((storageVal) => {
            const anchors = Array.from(document.querySelectorAll('a')) as any[];
            const matchedLink = anchors.find(a => {
                const text = a.innerText?.toLowerCase() || '';
                return text.includes('£') && (!storageVal || text.includes(storageVal.toLowerCase()));
            });

            if (!matchedLink) return null;
            const priceParts = matchedLink.innerText.split('\n').filter((t: string) => t.includes('£'));
            return priceParts.length > 0 ? priceParts[0] : null;
        }, storage);

        if (!priceText) {
            console.log(`[BackMarket] No product/price found for "${query}"`);
            return null;
        }

        const sellPrice = parsePrice(priceText);
        console.log(`[BackMarket] Found selling price: £${sellPrice}`);
        return { sellPrice };
    } catch (e: any) {
        console.error(`[BackMarket] Error scraping "${query}":`, e.message);
        return null;
    } finally {
        await page.close();
    }
}

async function scrapeMusicMagpie(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
    const page = await context.newPage();
    try {
        const mmSearchUrl = `https://www.musicmagpie.co.uk/store/search?q=${encodeURIComponent(query)}`;
        console.log(`[Music Magpie] Navigating: ${mmSearchUrl}`);
        await page.goto(mmSearchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const priceText = await page.evaluate((storageVal) => {
            const anchors = Array.from(document.querySelectorAll('a')) as any[];
            const matchedLink = anchors.find(a => {
                const text = a.innerText?.toLowerCase() || '';
                return text.includes('£') && (!storageVal || text.includes(storageVal.toLowerCase()));
            });

            if (!matchedLink) return null;
            const priceParts = matchedLink.innerText.split('\n').filter((t: string) => t.includes('£'));
            return priceParts.length > 0 ? priceParts[0] : null;
        }, storage);

        if (!priceText) {
            console.log(`[Music Magpie] No product/price found for "${query}"`);
            return null;
        }

        const sellPrice = parsePrice(priceText);
        console.log(`[Music Magpie] Found selling price: £${sellPrice}`);
        return { sellPrice };
    } catch (e: any) {
        console.error(`[Music Magpie] Error scraping "${query}":`, e.message);
        return null;
    } finally {
        await page.close();
    }
}

async function main() {
    console.log('Fetching active device catalogs from DB...');
    const devices = await prisma.deviceCatalog.findMany({
        where: { isActive: true },
        take: 2 // Scrape just 2 items for testing
    });

    console.log(`Fetched ${devices.length} devices for testing.`);
    if (devices.length === 0) {
        console.log('No devices found in the database. Exiting.');
        await prisma.$disconnect();
        return;
    }

    const searchItems: { brand: string; model: string; storage: string; fullName: string }[] = [];
    for (const dev of devices) {
        const storage = (dev.storageOptions && dev.storageOptions.length > 0 ? dev.storageOptions[0] : '') as string;
        searchItems.push({
            brand: dev.brand,
            model: dev.model,
            storage,
            fullName: storage ? `${dev.brand} ${dev.model} ${storage}` : `${dev.brand} ${dev.model}`
        });
    }

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 1000 }
    });

    const results: Record<string, DevicePrices> = {};

    for (const item of searchItems) {
        console.log(`\n--- Starting Scrape for: "${item.fullName}" ---`);
        
        const cex = await scrapeCeX(context, item.fullName, item.storage);
        await new Promise(r => setTimeout(r, 1500));
        
        const backMarket = await scrapeBackMarket(context, item.fullName, item.storage);
        await new Promise(r => setTimeout(r, 1500));
        
        const musicMagpie = await scrapeMusicMagpie(context, item.fullName, item.storage);

        results[item.fullName] = { cex, backMarket, musicMagpie };
        
        // Random wait between items
        const delay = 1000 + Math.random() * 2000;
        await new Promise(r => setTimeout(r, delay));
    }

    await browser.close();
    await prisma.$disconnect();

    console.log('\n====================================');
    console.log('SCRARED RESULTS (JSON):');
    console.log(JSON.stringify(results, null, 2));
    console.log('====================================');

    const testOutputPath = path.join(process.cwd(), 'scraper', 'test_scraped_prices.json');
    fs.writeFileSync(testOutputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Results saved to: ${testOutputPath}`);
}

main().catch(async (e) => {
    console.error('Fatal execution error:', e);
    await prisma.$disconnect();
});

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

declare const document: any;

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

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Main entry point to run the competitor scraper.
     */
    async runScraper(limit?: number): Promise<Record<string, DevicePrices>> {
        this.logger.log('Starting competitor price scraper...');
        
        // 1. Fetch active devices from DeviceCatalog
        const devices = await this.prisma.deviceCatalog.findMany({
            where: { isActive: true }
        });

        this.logger.log(`Found ${devices.length} active device configurations in catalog.`);

        // Determine all brand + model + storage variations to query
        const searchItems: { catalogId: string; brand: string; model: string; storage: string; fullName: string }[] = [];
        for (const dev of devices) {
            if (dev.storageOptions && dev.storageOptions.length > 0) {
                for (const storage of dev.storageOptions) {
                    searchItems.push({
                        catalogId: dev.id,
                        brand: dev.brand,
                        model: dev.model,
                        storage,
                        fullName: `${dev.brand} ${dev.model} ${storage}`
                    });
                }
            } else {
                searchItems.push({
                    catalogId: dev.id,
                    brand: dev.brand,
                    model: dev.model,
                    storage: '',
                    fullName: `${dev.brand} ${dev.model}`
                });
            }
        }

        this.logger.log(`Generated ${searchItems.length} total query variants to scrape.`);

        let itemsToScrape = searchItems;
        if (limit && limit > 0) {
            this.logger.log(`Limiting scrape execution to first ${limit} variants for testing/dry-run.`);
            itemsToScrape = searchItems.slice(0, limit);
        }

        // 2. Launch Playwright
        const browser: Browser = await chromium.launch({ headless: true });
        const context: BrowserContext = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 1000 }
        });
        const results: Record<string, DevicePrices> = {};

        // 3. Iterate and scrape each query variant
        let idx = 1;
        for (const item of itemsToScrape) {
            this.logger.log(`[${idx}/${itemsToScrape.length}] Scraping: "${item.fullName}"`);

            const cexPrices = await this.scrapeCeX(context, item.fullName, item.storage);
            
            // Introduce small throttle delay
            await new Promise(r => setTimeout(r, 1500));

            const bmPrices = await this.scrapeBackMarket(context, item.fullName, item.storage);

            await new Promise(r => setTimeout(r, 1500));

            const mmPrices = await this.scrapeMusicMagpie(context, item.fullName, item.storage);

            results[item.fullName] = {
                cex: cexPrices,
                backMarket: bmPrices,
                musicMagpie: mmPrices
            };

            // Add an extra random delay to behave human-like
            const delay = 1000 + Math.random() * 2000;
            await new Promise(r => setTimeout(r, delay));
            idx++;
        }

        await browser.close();

        // 4. Write results to JSON
        const downloadsDir = path.join(process.cwd(), 'prisma', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        const outputPath = path.join(downloadsDir, 'scraped_prices.json');
        
        const finalOutput = {
            scrapedAt: new Date().toISOString(),
            totalScraped: itemsToScrape.length,
            prices: results
        };

        fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf-8');
        this.logger.log(`Scraper completed successfully! Output saved to: ${outputPath}`);

        return results;
    }

    /**
     * Scrape prices from CeX (WeBuy)
     */
    private async scrapeCeX(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
        const page = await context.newPage();
        try {
            const cexSearchUrl = `https://uk.webuy.com/search?stext=${encodeURIComponent(query)}`;
            await page.goto(cexSearchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

            // Wait for product cards to load dynamically
            try {
                await page.waitForSelector('.search-product-card', { timeout: 20000 });
            } catch (e) {
                this.logger.warn(`CeX: Timed out waiting for cards to load for "${query}". Skeletons might still be present or page has no results.`);
                return null;
            }

            // Try accepting cookies
            try {
                const acceptBtn = await page.$('#onetrust-accept-btn-handler');
                if (acceptBtn) {
                    await acceptBtn.click();
                    await new Promise(r => setTimeout(r, 1000));
                }
            } catch (e) {
                // Ignore cookie errors
            }

            // Extract sell price
            const cardDataBeforeToggle = await page.evaluate((storageVal) => {
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

            if (!cardDataBeforeToggle || !cardDataBeforeToggle.priceText) {
                this.logger.warn(`CeX: No matching product found for query "${query}"`);
                return null;
            }

            const sellPrice = this.parsePrice(cardDataBeforeToggle.priceText);

            // Toggle to get Buy/Trade-in prices
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
                    
                    const cardDataAfterToggle = await page.evaluate((storageVal) => {
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

                        return {
                            texts
                        };
                    }, storage);

                    if (cardDataAfterToggle && cardDataAfterToggle.texts.length > 0) {
                        // CeX shows values like "We Buy For Cash: £X" and "We Buy For Exchange: £Y"
                        for (const text of cardDataAfterToggle.texts) {
                            if (text.toLowerCase().includes('cash')) {
                                buyCashPrice = this.extractFirstPrice(text);
                            }
                            if (text.toLowerCase().includes('exchange')) {
                                buyExchangePrice = this.extractFirstPrice(text);
                            }
                        }
                    }
                }
            } catch (e: any) {
                this.logger.warn(`CeX: Failed to toggle trade-in prices for "${query}": ${e.message}`);
            }

            return {
                sellPrice,
                buyCashPrice: buyCashPrice || null,
                buyExchangePrice: buyExchangePrice || null
            };
        } catch (e: any) {
            this.logger.error(`CeX scraping failed for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    /**
     * Scrape BackMarket
     */
    private async scrapeBackMarket(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
        const page = await context.newPage();
        try {
            const bmSearchUrl = `https://www.backmarket.co.uk/en-gb/search?q=${encodeURIComponent(query)}`;
            await page.goto(bmSearchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));

            // Check for Turnstile/Cloudflare challenge page
            const title = await page.title();
            if (title.includes('Cloudflare') || title.includes('Just a moment') || title.includes('Verify you are human')) {
                this.logger.warn(`BackMarket: Blocked by Cloudflare Turnstile for query "${query}"`);
                return null;
            }

            // Extract price from first card
            const priceText = await page.evaluate((storageVal) => {
                const anchors = Array.from(document.querySelectorAll('a')) as any[];
                const matchedLink = anchors.find(a => {
                    const text = a.innerText?.toLowerCase() || '';
                    return text.includes('£') && (!storageVal || text.includes(storageVal.toLowerCase()));
                });

                if (!matchedLink) return null;

                // Extract sections containing prices
                const priceParts = matchedLink.innerText.split('\n').filter((t: string) => t.includes('£'));
                return priceParts.length > 0 ? priceParts[0] : null;
            }, storage);

            if (!priceText) {
                this.logger.warn(`BackMarket: Price not found for query "${query}"`);
                return null;
            }

            const sellPrice = this.parsePrice(priceText);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`BackMarket scraping failed for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    /**
     * Scrape Music Magpie
     */
    private async scrapeMusicMagpie(context: BrowserContext, query: string, storage: string): Promise<CompetitorPrices | null> {
        const page = await context.newPage();
        try {
            const mmSearchUrl = `https://www.musicmagpie.co.uk/store/search?q=${encodeURIComponent(query)}`;
            await page.goto(mmSearchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));

            // Extract price from first matched link
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
                this.logger.warn(`Music Magpie: Price not found for query "${query}"`);
                return null;
            }

            const sellPrice = this.parsePrice(priceText);
            return { sellPrice };
        } catch (e: any) {
            this.logger.error(`Music Magpie scraping failed for "${query}": ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    /**
     * Helper to parse numerical price from string e.g. "£199.00" -> 199
     */
    private parsePrice(text: string): number | null {
        const cleaned = text.replace(/[^0-9.]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) ? null : val;
    }

    /**
     * Helper to extract first price match from a text string
     */
    private extractFirstPrice(text: string): number | null {
        const match = text.match(/£\s*(\d+(?:\.\d{2})?)/);
        if (match && match[1]) {
            const val = parseFloat(match[1]);
            return isNaN(val) ? null : val;
        }
        return null;
    }
}

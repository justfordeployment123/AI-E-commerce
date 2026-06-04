import { ScraperService } from './scraper.service';

class TestableScraperService extends ScraperService {
    public testExtractPrice(markdown: string, storage: string) {
        return this['extractPriceFromMarkdown'](markdown, storage);
    }
}

describe('ScraperService', () => {
    let service: TestableScraperService;

    beforeEach(() => {
        service = new TestableScraperService(null as any);
    });

    describe('extractPriceFromMarkdown', () => {
        it('returns price from line matching storage', () => {
            const md = `
## iPhone 15 Pro 256GB
**£559**

## iPhone 15 Pro 128GB
**£489**
            `;
            expect(service.testExtractPrice(md, '128GB')).toBe(489);
        });

        it('returns first price when storage not found', () => {
            const md = `
Some product
Price: £299
Another: £350
            `;
            expect(service.testExtractPrice(md, '512GB')).toBe(299);
        });

        it('returns null when no price present', () => {
            const md = 'No prices here at all';
            expect(service.testExtractPrice(md, '128GB')).toBeNull();
        });

        it('ignores prices of £1 or less', () => {
            const md = 'Delivery: £1\nProduct: £249';
            expect(service.testExtractPrice(md, '')).toBe(249);
        });

        it('handles £NNN.NN format', () => {
            const md = 'From £249.99 with free delivery';
            expect(service.testExtractPrice(md, '')).toBe(249.99);
        });

        it('handles storage with space: "128 GB"', () => {
            const md = `
## 256 GB model £400
## 128 GB model £320
            `;
            expect(service.testExtractPrice(md, '128GB')).toBe(320);
        });
    });
});

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3002';

interface Product { id: string; slug: string; price: number | null; stock: number }

// Picks a real, purchasable (priced + in-stock) product straight from the API —
// far more reliable than clicking through category listings that may contain
// out-of-stock or price-pending (F-grade / manual-review) items.
async function findPurchasableProduct(request: APIRequestContext, category: string): Promise<Product> {
    const res = await request.get(`${API_URL}/products?category=${category}&limit=50&excludeOthers=true`);
    expect(res.ok()).toBeTruthy();
    const { items } = await res.json() as { items: Product[] };
    const product = items.find(p => p.price !== null && p.price > 0 && p.stock > 0);
    if (!product) throw new Error(`No purchasable "${category}" product found — seed the catalog first.`);
    return product;
}

test.describe('Guest checkout', () => {
    test('browse → add to cart → dev-mode checkout → order confirmed', async ({ page, request }) => {
        const product = await findPurchasableProduct(request, 'phones');

        await page.goto(`/shop/phones/${product.slug}`);
        await page.getByRole('button', { name: 'Add to cart' }).click();
        await expect(page.getByRole('button', { name: 'Added to cart' })).toBeVisible();

        await page.goto('/checkout');
        await expect(page.getByRole('heading', { name: 'Delivery details' })).toBeVisible();

        await page.getByPlaceholder('First name').fill('Ada');
        await page.getByPlaceholder('Last name').fill('Lovelace');
        await page.getByPlaceholder('you@example.com').fill(`ada.${Date.now()}@example.com`);
        await page.getByPlaceholder('+44 7700 000000').fill('+447700900123');
        await page.getByPlaceholder('123 High Street, Apt 4').fill('10 Analytical Engine Way');
        await page.getByPlaceholder('Leicester').fill('Leicester');
        await page.getByPlaceholder('LE1 1AA').fill('LE1 1AA');

        await page.getByRole('button', { name: 'Continue to payment' }).click();
        await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();

        // If a live Stripe key is configured, fill the real card iframe with a test card.
        // Otherwise the app runs in dev-mode bypass and the button is immediately clickable.
        const cardFrame = page.locator('iframe[name^="__privateStripeFrame"]').first();
        if (await cardFrame.count() > 0) {
            const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
            await frame.locator('[name="cardnumber"]').fill('4242424242424242');
            await frame.locator('[name="exp-date"]').fill('12/34');
            await frame.locator('[name="cvc"]').fill('123');
        }

        await page.getByRole('button', { name: 'Review order' }).click();
        await expect(page.getByRole('heading', { name: /Review .* place order/i })).toBeVisible();

        await page.getByRole('button', { name: /Place order/ }).click();

        await expect(page.getByRole('heading', { name: 'Order confirmed!' })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/Your order #/)).toBeVisible();
    });
});

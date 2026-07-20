import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@techstop.co.uk';
const ADMIN_PASSWORD = 'password';

async function loginAsAdmin(page: import('@playwright/test').Page) {
    await page.goto('/login');
    await page.getByPlaceholder('admin@techstop.co.uk').fill(ADMIN_EMAIL);
    await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('http://localhost:3001/');
}

// Store Locations is a simple, self-contained CRUD screen (no image upload, no
// catalog links) — a good stand-in for the admin panel's "point-and-click CRUD"
// pattern shared by products, brands, categories, etc.
test.describe('Admin: Store Locations CRUD', () => {
    test('create → edit → delete a store', async ({ page }) => {
        const storeName = `E2E Test Store ${Date.now()}`;

        await loginAsAdmin(page);
        await page.goto('/stores');
        await expect(page.getByRole('heading', { name: 'Store Locations' })).toBeVisible();

        // ── Create ──────────────────────────────────────────────────────────
        await page.getByRole('button', { name: 'Add store' }).click();
        const createForm = page.locator('xpath=//h2[normalize-space(text())="New store"]/ancestor::div[contains(@class,"bg-white")][1]');
        await expect(createForm).toBeVisible();
        await createForm.getByPlaceholder('e.g. TechStop Leicester').fill(storeName);
        await createForm.getByPlaceholder('e.g. 42 High Street').fill('99 Test Avenue');
        await createForm.getByPlaceholder('e.g. Leicester').fill('Leicester');
        await createForm.getByPlaceholder('e.g. LE1 1AA').fill('LE1 1AA');
        await createForm.getByPlaceholder('e.g. +44 116 123 4567').fill('+441161112222');
        await createForm.getByRole('button', { name: 'Add store', exact: true }).click();

        const card = page.locator(`xpath=//p[normalize-space(text())="${storeName}"]/ancestor::div[contains(@class,"rounded-3xl")][1]`);
        await expect(card).toBeVisible();
        await expect(card).toContainText('+441161112222');

        // ── Edit ────────────────────────────────────────────────────────────
        await card.locator('button').nth(1).click(); // pencil icon — no accessible name
        const editForm = page.locator('xpath=//h2[normalize-space(text())="Edit store"]/ancestor::div[contains(@class,"bg-white")][1]');
        await expect(editForm).toBeVisible();
        await editForm.getByPlaceholder('e.g. +44 116 123 4567').fill('+449998887777');
        await editForm.getByRole('button', { name: 'Save changes' }).click();

        await expect(card).toContainText('+449998887777');

        // ── Delete ──────────────────────────────────────────────────────────
        await card.locator('button').nth(2).click(); // trash icon — no accessible name
        await expect(page.getByText(storeName, { exact: true })).not.toBeVisible();
    });
});

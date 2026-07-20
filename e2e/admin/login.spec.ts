import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@techstop.co.uk';
const ADMIN_PASSWORD = 'password';

test.describe('Admin login', () => {
    test('rejects bad credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('admin@techstop.co.uk').fill('nobody@example.com');
        await page.getByPlaceholder('••••••••').fill('wrong-password');
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page.getByText(/Invalid credentials|Not authorised/i)).toBeVisible();
    });

    test('logs in with valid seeded admin credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('admin@techstop.co.uk').fill(ADMIN_EMAIL);
        await page.getByPlaceholder('••••••••').fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await page.waitForURL('http://localhost:3001/');
        // Landing on the dashboard (not bounced back to /login) confirms the session stuck.
        await expect(page).toHaveURL('http://localhost:3001/');
    });
});

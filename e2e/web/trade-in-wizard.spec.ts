import { test, expect } from '@playwright/test';

// The trade-in wizard is gated behind login + a complete profile (name, phone,
// address, city, postcode) — see guardedOpen() in app/(services)/trade-in/page.tsx.
// This test signs up a fresh customer, completes their profile, then taps through
// the wizard's device-selection steps (category is pre-set by the "Start Postal
// Quote" CTA) to verify the brief's "genuinely tap-driven, no free text" claim.
//
// Scope note: it stops at "Device Specifications & Condition" (end of device
// selection) rather than completing a full submission — going further requires
// photo upload and a real AI pricing call (OpenAI/scraper-backed), which isn't
// something to exercise on every test run.

test.describe('Trade-in wizard', () => {
    test('signup → complete profile → tap through device selection', async ({ page }) => {
        const email = `e2e.tradein.${Date.now()}@example.com`;

        await page.goto('/signup');
        await page.getByPlaceholder('John Doe').fill('Grace Hopper');
        await page.getByPlaceholder('you@example.com').fill(email);
        await page.getByPlaceholder('••••••••').fill('correct-horse-battery-staple');
        await page.getByRole('button', { name: 'Create Account' }).click();
        await page.waitForURL('**/account');

        await page.goto('/account/settings');
        await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
        await page.getByPlaceholder('+44 7700 000000').fill('+447700900456');
        await page.getByPlaceholder('123 High Street').fill('1 Bletchley Park Road');
        await page.getByPlaceholder('Leicester').fill('Leicester');
        await page.getByPlaceholder('LE1 1AA').fill('LE1 1AA');
        await page.getByRole('button', { name: 'Save changes' }).click();
        await expect(page.getByText('Changes saved!')).toBeVisible();

        await page.goto('/trade-in');
        await page.getByRole('button', { name: 'Start Postal Quote' }).click();

        // Category is pre-set to "Phone" by the CTA, so the wizard opens directly
        // on brand selection — no free-text entry required anywhere in this flow.
        const brandHeading = page.getByRole('heading', { name: 'Which brand is it?' });
        await expect(brandHeading).toBeVisible();
        const brandStep = page.locator('xpath=//h2[normalize-space(text())="Which brand is it?"]/ancestor::div[contains(@class,"space-y-6")][1]');
        await brandStep.getByRole('button', { name: 'Apple', exact: true }).click();

        const modelHeading = page.getByRole('heading', { name: 'Which model is it?' });
        await expect(modelHeading).toBeVisible();
        const modelStep = page.locator('xpath=//h2[normalize-space(text())="Which model is it?"]/ancestor::div[contains(@class,"space-y-6")][1]');
        await modelStep.locator('div.grid button').first().click();

        await expect(page.getByRole('heading', { name: 'Device Specifications & Condition' })).toBeVisible();
    });
});

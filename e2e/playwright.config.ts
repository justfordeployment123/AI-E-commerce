import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..');

// Golden-path e2e coverage for the storefront (apps/web) and admin panel (apps/admin).
// Requires the API + database to already be running (npm run infra:up && npm run api:dev,
// or the full `npm run dev`) — these tests exercise real backend behavior, not mocks.
export default defineConfig({
    testDir: __dirname,
    fullyParallel: false, // tests create/mutate real DB rows (users, orders, stores) — keep sequential to avoid cross-test interference
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [['list']],
    use: {
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'web',
            testDir: path.join(__dirname, 'web'),
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
        },
        {
            name: 'admin',
            testDir: path.join(__dirname, 'admin'),
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
        },
    ],
    webServer: [
        {
            command: 'npm run web:dev',
            cwd: REPO_ROOT,
            url: 'http://localhost:3000',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
        {
            command: 'npm run admin:dev',
            cwd: REPO_ROOT,
            url: 'http://localhost:3001',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
    ],
});

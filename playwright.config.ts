import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['BASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}. Copy .env.example to .env and fill it in.`);
    }
}

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    workers: 2,
    retries: process.env.CI ? 1 : 0,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: process.env.BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
});

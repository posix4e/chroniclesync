import { defineConfig } from '@playwright/test';
import { paths } from './config';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    headless: false,
    baseURL: process.env.API_URL || 'http://localhost:8787',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: {
          args: [
            '--no-sandbox',
            `--disable-extensions-except=${paths.extension}`,
            `--load-extension=${paths.extension}`,
          ],
        },
      },
    },
  ],
  workers: 1,
});
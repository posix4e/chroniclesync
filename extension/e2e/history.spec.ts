import { test } from '@playwright/test';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

test('history sync', async () => {
  // Load the extension
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pathToExtension = path.join(__dirname, '..', 'dist');
  const userDataDir = '/tmp/test-user-data-dir';
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Create a new page
  const page = await context.newPage();

  // Visit some test pages
  await page.goto('https://example.com');
  await page.waitForTimeout(1000); // Wait for history to be recorded

  await page.goto('https://example.org');
  await page.waitForTimeout(1000);

  // Wait for sync interval
  await page.waitForTimeout(5000);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/history-sync.png' });

  // Cleanup
  await context.close();
});
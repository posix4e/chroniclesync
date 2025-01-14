import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('extension popup should load', async () => {
  const pathToExtension = path.join(__dirname, '../../../dist/chrome');
  
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Get the extension ID from the background page
  const backgroundPages = context.backgroundPages();
  const extensionId = backgroundPages[0]?.url()?.split('/')[2];
  expect(extensionId).toBeTruthy();

  // Create a new page and navigate to the extension popup
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  // Wait for the root element where React mounts
  await page.waitForSelector('#root');
  
  // Verify the popup is visible
  const root = await page.$('#root');
  expect(root).toBeTruthy();

  // Clean up
  await context.close();
});
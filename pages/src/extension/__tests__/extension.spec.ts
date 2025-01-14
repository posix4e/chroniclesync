import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test('extension popup should load', async () => {
  const pathToExtension = path.join(__dirname, '../../../dist/chrome');
  
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Wait for the background page to be available
  let extensionId: string | undefined;
  let retries = 0;
  while (!extensionId && retries < 5) {
    const backgroundPages = context.backgroundPages();
    extensionId = backgroundPages[0]?.url()?.split('/')[2];
    if (!extensionId) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
  }
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
import { BrowserContext, Page } from '@playwright/test';

export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Create a new page to trigger service worker initialization
  const page = await context.newPage();
  await page.goto('https://example.com');

  // Wait for service worker to initialize
  let workers = context.serviceWorkers();
  let attempts = 0;
  const maxAttempts = 10;

  while (workers.length === 0 && attempts < maxAttempts) {
    await page.waitForTimeout(500);
    workers = context.serviceWorkers();
    attempts++;
  }

  if (workers.length === 0) {
    throw new Error('No service workers found after multiple attempts');
  }

  // Get the extension ID from the first service worker URL
  const workerUrl = workers[0].url();
  const match = workerUrl.match(/chrome-extension:\/\/([^/]+)/);
  if (!match) {
    throw new Error('Could not extract extension ID from service worker URL');
  }

  // Close the temporary page
  await page.close();

  return match[1];
}
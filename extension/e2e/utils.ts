import { BrowserContext } from '@playwright/test';

export async function getExtensionId(context: BrowserContext): Promise<string> {
  // Wait for service worker to be available
  let workers = context.serviceWorkers();
  let attempts = 0;
  const maxAttempts = 10;

  while (workers.length === 0 && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 500));
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

  return match[1];
}
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import { paths } from '../../config';

import type { Worker } from '@playwright/test';

export type TestFixtures = {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
};

export const test = base.extend<TestFixtures>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${paths.extension}`,
        `--load-extension=${paths.extension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be registered
    await context.waitForEvent('serviceworker');
    const workers = context.serviceWorkers();
    const extensionId = workers.length ? 
      new URL(workers[0].url()).hostname : 
      'unknown-extension-id';
    await use(extensionId);
  },
  serviceWorker: async ({ context }: { context: BrowserContext }, use: (worker: Worker) => Promise<void>) => {
    // Wait for service worker to be registered
    await context.waitForEvent('serviceworker');
    const workers = context.serviceWorkers();
    await use(workers[0]);
  },
});

export const expect = test.expect;

export async function getExtensionId(context: BrowserContext): Promise<string> {
  await context.waitForEvent('serviceworker');
  const workers = context.serviceWorkers();
  return workers.length ? 
    new URL(workers[0].url()).hostname : 
    'unknown-extension-id';
}
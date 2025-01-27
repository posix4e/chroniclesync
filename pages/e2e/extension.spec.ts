import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { paths, server } from '../config';

if (!existsSync(paths.extensionDist)) {
  throw new Error('Extension not built. Run `npm run build:extension` first.');
}

test('Chrome Extension functionality', async ({ context }) => {

  // Get extension ID directly from service workers
  const workers = await context.serviceWorkers();
  if (!workers.length) {
    throw new Error('No service workers found - extension not loaded properly');
  }
  const extensionId = workers[0].url().split('/')[2];

  // Create main test page
  const mainPage = await context.newPage();

  // Set up error tracking
  const errors: string[] = [];
  const trackErrors = (error: string) => {
    console.log('Error:', error);
    errors.push(error);
    // Take screenshot immediately when error occurs
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    mainPage.screenshot({
      path: `test-results/error-${timestamp}.png`,
      fullPage: true
    }).catch((error: Error) => console.error('Failed to take error screenshot:', error));
  };

  // Track web errors
  context.on('weberror', error => {
    trackErrors(`Web error: ${error.error().message}`);
  });

  // Set up handlers for all pages
  context.on('page', page => {
    // Handle dialogs
    page.on('dialog', async dialog => {
      console.log('Dialog appeared:', dialog.message());
      await dialog.accept();
    });

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().includes('net::ERR_FILE_NOT_FOUND') &&
          !msg.text().includes('status of 404')) {
        trackErrors(`Console error: ${msg.text()}`);
      }
    });

    // Track page errors
    page.on('pageerror', error => {
      trackErrors(`Page error: ${error.message}`);
    });
  });

  // 1. Verify extension setup
  console.log('Extension loaded with ID:', extensionId);
  expect(extensionId, 'Extension ID should be valid').not.toBe('unknown-extension-id');
  expect(extensionId, 'Extension ID should match expected format').toMatch(/^[a-z]{32}$/);

  // 2. API health check
  const apiUrl = process.env.API_URL || server.apiUrl;
  console.log('Testing API health at:', `${apiUrl}/health`);
  const healthResponse = await mainPage.request.get(`${apiUrl}/health`);
  const responseBody = await healthResponse.json();
  expect(healthResponse.ok()).toBeTruthy();
  expect(responseBody.healthy).toBeTruthy();

  // 3. Initial popup load and UI verification
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'domcontentloaded' });
  await popupPage.waitForSelector('#root', { state: 'visible', timeout: 2000 });
  await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');

  // 4. Generate test history
  const testPage = { url: 'https://example.com/test', title: 'Test Page' };
  const historyPage = await context.newPage();
  await historyPage.goto(testPage.url, { waitUntil: 'domcontentloaded' });
  await historyPage.close();

  // 5. Client initialization and sync
  await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 2000 });
  await popupPage.fill('#clientId', 'test-client');
  await popupPage.click('text=Initialize');
  await popupPage.waitForSelector('.history-entry', { timeout: 2000 });

  // 6. Verify history entry
  const entryExists = await popupPage.locator(`.history-entry a[href="${testPage.url}"]`).count() > 0;
  expect(entryExists).toBeTruthy();

  // Verify no errors occurred throughout the test
  expect(errors, `Errors found during test:\n${errors.join('\n')}`).toEqual([]);
});
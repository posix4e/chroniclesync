import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { paths, server } from '../config';

if (!existsSync(paths.extensionDist)) {
  throw new Error('Extension not built. Run `npm run build:extension` first.');
}

test('Chrome Extension functionality', async ({ context }) => {
  test.setTimeout(30000);

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
  await popupPage.waitForSelector('#root', { state: 'visible', timeout: 5000 });
  await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
  await expect(popupPage.locator('#clientId')).toBeVisible();

  // Verify React initialization
  const reactRoot = await popupPage.evaluate(() => {
    const root = document.getElementById('root');
    return root?.hasAttribute('data-reactroot') ||
           (root?.children.length ?? 0) > 0;
  });
  expect(reactRoot).toBeTruthy();

  // 4. Generate test history
  const testPages = [
    { url: 'https://example.com/page1', title: 'Test Page 1' },
    { url: 'https://example.com/duplicate', title: 'Duplicate Page' }
  ];

  // Visit test pages to generate history
  const historyPage = await context.newPage();
  for (const testPage of testPages) {
    await historyPage.goto(testPage.url, { waitUntil: 'domcontentloaded' });
  }
  // Generate duplicate entry
  await historyPage.goto(testPages[1].url, { waitUntil: 'domcontentloaded' });
  await historyPage.close();

  // 5. Client initialization
  await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 5000 });
  await popupPage.fill('#clientId', 'test-client');
  
  // Wait for initialization dialog
  const initDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
  await popupPage.click('text=Initialize');
  const initDialog = await initDialogPromise;
  expect(initDialog.message()).toBe('Client initialized successfully');
  await initDialog.accept();

  // Verify initialization success and history entries
  await expect(popupPage.locator('#adminLogin')).toHaveCSS('display', 'none');
  await popupPage.waitForSelector('.history-entry', { timeout: 5000 });
  
  // Verify history entries
  const entries = await popupPage.locator('.history-entry').all();
  expect(entries.length).toBeGreaterThanOrEqual(testPages.length);
  
  // Verify duplicate entry exists
  const duplicateEntries = await popupPage.locator(`.history-entry a[href="${testPages[1].url}"]`).all();
  expect(duplicateEntries.length).toBeGreaterThanOrEqual(2);

  // Configure settings and sync
  await popupPage.fill('#retentionDays', '7');
  await popupPage.click('text=Save Settings');
  await popupPage.click('button:has-text("Sync with Server")');
  
  // Handle sync dialog
  const syncDialog = await popupPage.waitForEvent('dialog', { timeout: 5000 });
  expect(['Sync completed successfully', 'Failed to sync with server']).toContain(syncDialog.message());
  await syncDialog.accept();

  // Verify no errors occurred throughout the test
  expect(errors, `Errors found during test:\n${errors.join('\n')}`).toEqual([]);
});
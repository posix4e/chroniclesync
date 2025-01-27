import { test, expect } from '@playwright/test';
import { existsSync } from 'fs';
import { paths, server } from '../config';

if (!existsSync(paths.extensionDist)) {
  throw new Error('Extension not built. Run `npm run build:extension` first.');
}

test('Chrome Extension functionality', async ({ context }) => {

  // Create main test page and get extension ID
  const page = await context.newPage();
  await page.goto('https://example.com');
  const workers = await context.serviceWorkers();
  if (!workers.length) {
    throw new Error('No service workers found - extension not loaded properly');
  }
  const extensionId = workers[0].url().split('/')[2];

  // Set up error tracking
  const errors: string[] = [];
  const trackErrors = (error: string) => {
    console.log('Error:', error);
    errors.push(error);
    // Take screenshot immediately when error occurs
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    page.screenshot({
      path: `test-results/error-${timestamp}.png`,
      fullPage: true
    }).catch(e => console.error('Failed to take error screenshot:', e));
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
  const healthResponse = await page.request.get(`${apiUrl}/health`);
  const responseBody = await healthResponse.json();
  expect(healthResponse.ok()).toBeTruthy();
  expect(responseBody.healthy).toBeTruthy();

  // 3. Initial popup load and UI verification
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await popupPage.waitForLoadState('domcontentloaded');
  await popupPage.waitForLoadState('networkidle');

  // Screenshot: Initial extension popup state with login form
  await popupPage.screenshot({
    path: 'test-results/steps/01-initial-popup-with-login.png',
    fullPage: true
  });

  // Verify initial UI state
  await popupPage.waitForSelector('#root', { state: 'visible' });
  await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
  await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
  await expect(popupPage.locator('#adminLogin')).toBeVisible();
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
    { url: 'https://example.com/page2', title: 'Test Page 2' },
    { url: 'https://example.com/duplicate', title: 'Duplicate Page' }
  ];

  // Visit test pages to generate history
  for (const testPage of testPages) {
    const historyPage = await context.newPage();
    await historyPage.goto(testPage.url);
    await historyPage.waitForLoadState('networkidle');
    await historyPage.close();
  }

  // Generate duplicate entries
  const duplicatePage = await context.newPage();
  for (let i = 0; i < 2; i++) {
    await duplicatePage.goto(testPages[2].url);
    await duplicatePage.waitForLoadState('networkidle');
  }
  await duplicatePage.close();

  // 5. Client initialization
  await popupPage.waitForSelector('#clientId', { state: 'visible', timeout: 5000 });
  await popupPage.fill('#clientId', 'test-client');
  
  // Wait for initialization dialog
  const initDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
  await popupPage.click('text=Initialize');
  const initDialog = await initDialogPromise;
  expect(initDialog.message()).toBe('Client initialized successfully');
  await initDialog.accept();

  // Screenshot: After successful client initialization
  await popupPage.screenshot({
    path: 'test-results/steps/02-after-client-initialization.png',
    fullPage: true
  });

  // Verify initialization success
  await expect(popupPage.locator('#adminLogin')).toHaveCSS('display', 'none');

  // 6. Verify history entries
  await popupPage.waitForSelector('.history-entry', { timeout: 5000 });
  const entries = await popupPage.locator('.history-entry').all();
  expect(entries.length).toBeGreaterThanOrEqual(testPages.length);

  // Verify all test pages appear in history
  for (const testPage of testPages) {
    const entryExists = await popupPage.locator(`.history-entry a[href="${testPage.url}"]`).count() > 0;
    expect(entryExists).toBeTruthy();
  }

  // 7. Configure settings
  await popupPage.fill('#retentionDays', '7');
  await popupPage.click('text=Save Settings');

  // 8. Test sync functionality
  const syncButton = await popupPage.waitForSelector('button:has-text("Sync with Server")', 
    { state: 'visible', timeout: 5000 });
  
  // Set up dialog listener before clicking
  const syncDialogPromise = popupPage.waitForEvent('dialog', { timeout: 5000 });
  await syncButton.click();
  
  // Wait for and verify dialog
  const syncDialog = await syncDialogPromise;
  expect(['Sync completed successfully', 'Failed to sync with server']).toContain(syncDialog.message());
  await syncDialog.accept();

  // Screenshot: After sync completion showing history entries
  await popupPage.screenshot({
    path: 'test-results/steps/03-after-sync-with-history.png',
    fullPage: true
  });

  // 9. Verify deduplication
  const duplicateEntries = await popupPage.locator(`.history-entry a[href="${testPages[2].url}"]`).all();
  expect(duplicateEntries.length).toBeGreaterThanOrEqual(1);

  // Verify timestamps are different
  const timestamps = await popupPage.evaluate((url) => {
    const entries = document.querySelectorAll(`.history-entry a[href="${url}"]`);
    return Array.from(entries).map(entry => 
      entry.nextElementSibling?.textContent
    );
  }, testPages[2].url);

  const uniqueTimestamps = new Set(timestamps);
  expect(uniqueTimestamps.size).toBe(timestamps.length);

  // Screenshot: Final state showing deduplication results
  await popupPage.screenshot({
    path: 'test-results/steps/04-final-with-deduplication.png',
    fullPage: true
  });

  // Verify no errors occurred throughout the test
  expect(errors, `Errors found during test:\n${errors.join('\n')}`).toEqual([]);
});
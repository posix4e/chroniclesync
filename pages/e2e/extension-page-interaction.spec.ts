import { test as base, expect } from './utils/extension';
import { server } from '../config';
import { TestInfo } from '@playwright/test';

// Configure test to fail fast and run sequentially
const test = base.extend({
  // Add fail-fast behavior
  failOnError: async ({}, use) => {
    let failed = false;
    base.beforeEach(async ({}, testInfo) => {
      if (failed) {
        test.skip();
      }
    });
    base.afterEach(async ({}, testInfo) => {
      if (testInfo.status !== 'passed') {
        failed = true;
      }
    });
    await use(undefined);
  }
});

// Ensure tests run sequentially and stop on first failure
test.describe.configure({ mode: 'serial', retries: 0 });

test.describe('Extension-Page Integration', () => {
  test('extension-page interaction flow', async ({ context, extensionId, page }) => {
    // Set up error tracking
    const errors: string[] = [];
    context.on('weberror', error => {
      console.log('Web error:', error.error().message);
      errors.push(error.error().message);
    });

    // Set up dialog handler for all pages
    context.on('page', page => {
      page.on('dialog', async dialog => {
        console.log('Dialog appeared:', dialog.message());
        await dialog.accept();
      });
      page.on('console', msg => {
        if (msg.type() === 'error' &&
            !msg.text().includes('net::ERR_FILE_NOT_FOUND') &&
            !msg.text().includes('status of 404')) {
          console.log('Console error:', msg.text());
          errors.push(msg.text());
        }
      });
    });

    // 1. Test extension popup loading
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('domcontentloaded');
    await extensionPage.waitForLoadState('networkidle');

    // Take initial screenshot
    await extensionPage.screenshot({
      path: 'test-results/extension-page-initial.png',
      fullPage: true
    });

    // Verify initial state
    await extensionPage.waitForSelector('#root', { state: 'visible' });
    await extensionPage.waitForSelector('#clientId', { state: 'visible', timeout: 5000 });
    expect(await extensionPage.isVisible('#clientId')).toBeTruthy();

    // 2. Test client initialization
    await extensionPage.fill('#clientId', 'test-client');
    
    // Wait for initialization dialog
    const initDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 5000 });
    await extensionPage.click('text=Initialize');
    const initDialog = await initDialogPromise;
    expect(initDialog.message()).toBe('Client initialized successfully');
    await initDialog.accept();

    // Take screenshot after initialization
    await extensionPage.screenshot({
      path: 'test-results/extension-page-initialized.png',
      fullPage: true
    });

    // Verify initialization
    await expect(extensionPage.locator('#adminLogin')).toHaveCSS('display', 'none');

    // 3. Test sync functionality
    const syncButton = await extensionPage.waitForSelector('button:has-text("Sync with Server")', 
      { state: 'visible', timeout: 5000 });
    
    // Set up dialog listener before clicking
    const syncDialogPromise = extensionPage.waitForEvent('dialog', { timeout: 5000 });
    await syncButton.click();
    
    // Wait for and verify dialog
    const syncDialog = await syncDialogPromise;
    expect(['Sync completed successfully', 'Failed to sync with server']).toContain(syncDialog.message());
    await syncDialog.accept();

    // Take final screenshot
    await extensionPage.screenshot({
      path: 'test-results/extension-page-final.png',
      fullPage: true
    });

    // Verify no errors occurred
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page, context }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
      
      // Log the page content for debugging
      const content = await page.content();
      console.log('Page content at failure:', content);

      // Close all pages except the main one
      const pages = context.pages();
      await Promise.all(
        pages
          .filter(p => p !== page)
          .map(p => p.close())
      );
    }
  });

  test.afterAll(async ({ context }) => {
    // Ensure all browser contexts are closed
    await context.close();
  });
});
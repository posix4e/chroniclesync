import { test, expect } from './utils/extension';

test.describe('Extension-Page Integration', () => {
  test('extension popup loads correctly', async ({ context }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    const historySync = await extensionPage.waitForSelector('.history-sync');
    expect(historySync).toBeTruthy();

    // Take screenshot for visual verification
    await extensionPage.screenshot({ 
      path: 'test-results/popup-loaded.png',
      fullPage: true 
    });
  });

  test('history sync end-to-end test', async ({ context }) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('.history-sync');
    
    // Take screenshot before sync
    await extensionPage.screenshot({ 
      path: 'test-results/before-sync.png',
      fullPage: true 
    });

    // Click sync button and wait for completion
    await extensionPage.click('text=Sync History');
    await extensionPage.waitForTimeout(1000); // Wait for sync to complete

    // Take screenshot after sync
    await extensionPage.screenshot({ 
      path: 'test-results/after-sync.png',
      fullPage: true 
    });
  });

  test('no console errors during operations', async ({ context }) => {
    const extensionPage = await context.newPage();
    const errors: string[] = [];
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('.history-sync');
    await extensionPage.click('text=Sync History');
    await extensionPage.waitForTimeout(1000); // Wait for sync to complete

    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Capture a screenshot after each test if it fails
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    }
  });
});
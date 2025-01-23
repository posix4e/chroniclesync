import { test, expect } from './utils/extension';

test.describe('Extension-Page Integration', () => {
  test('extension can interact with page', async ({ page, context, extensionId }) => {
    // Load the web page
    await page.goto('/');
    await page.screenshot({ path: 'test-results/01-initial-page.png' });
    
    // Open extension popup
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for React to mount and render content
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForTimeout(1000); // Give React a moment to hydrate
    await extensionPage.screenshot({ path: 'test-results/02-extension-loaded.png' });
    
    // Interact with extension
    await expect(extensionPage.locator('#syncButton')).toBeVisible();
    await extensionPage.click('#syncButton');
    await extensionPage.screenshot({ path: 'test-results/03-after-sync-click.png' });
    
    // Verify the effect on the main page
    await expect(page.locator('#syncStatus')).toBeVisible();
    await expect(page.locator('#syncComplete')).toBeVisible();
    await page.screenshot({ path: 'test-results/04-sync-complete.png' });
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Capture a screenshot after each test if it fails
    if (testInfo.status !== testInfo.expectedStatus) {
      // Create a unique name for the failure screenshot
      const screenshotPath = `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    }
  });
});
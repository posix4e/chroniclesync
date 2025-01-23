import { test, expect } from './utils/extension';

test.describe('Extension-Page Integration', () => {
  test('extension can interact with page', async ({ page, context, extensionId }) => {
    // Set up dialog handler for main page
    page.on('dialog', dialog => dialog.accept());
    
    // Load and capture initial web page
    await page.goto('/');
    await page.screenshot({ path: 'test-results/01-initial-page.png' });
    
    // Create and configure extension page
    const extensionPage = await context.newPage();
    
    // Set up dialog handlers before any actions
    page.on('dialog', dialog => dialog.accept());
    extensionPage.on('dialog', dialog => dialog.accept());
    
    // Open extension popup
    await extensionPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    
    // Wait for React to mount and render content
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForSelector('#clientId'); // Wait for React to render the form
    await extensionPage.screenshot({ path: 'test-results/02-extension-loaded.png' });
    
    // Initialize client
    await extensionPage.fill('#clientId', 'test-client');
    await extensionPage.click('text=Initialize');
    await extensionPage.screenshot({ path: 'test-results/03-client-initialized.png' });
    
    // Set up response handler before clicking
    const responsePromise = extensionPage.waitForResponse(response => 
      response.url().includes('api.chroniclesync.xyz') && 
      response.request().method() === 'POST'
    );

    // Click sync button
    await extensionPage.click('text=Sync with Server');
    await extensionPage.screenshot({ path: 'test-results/04-after-sync-click.png' });
    
    // Wait for sync to complete
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    
    // Final state of both windows
    await extensionPage.screenshot({ path: 'test-results/06-extension-final.png' });
    await page.screenshot({ path: 'test-results/07-page-final.png' });
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    // No need to wait, errors would have been collected during the test
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
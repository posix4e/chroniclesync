import { test, expect } from './utils/extension';

test.describe('Extension-Page Integration', () => {
  test('extension can interact with page', async ({ page, context, extensionId }) => {
    // Load the web page
    await page.goto('/');
    
    // Open extension popup
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Wait for React to mount and render content
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForTimeout(1000); // Give React a moment to hydrate
    
    // Interact with extension
    await expect(extensionPage.locator('#syncButton')).toBeVisible();
    await extensionPage.click('#syncButton');
    
    // Verify the effect on the main page
    await expect(page.locator('#syncStatus')).toBeVisible();
    await expect(page.locator('#syncComplete')).toBeVisible();
    
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
});
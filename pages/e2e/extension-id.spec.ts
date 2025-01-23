import { test, expect, chromium } from './utils/extension';

test.describe('Extension ID Detection', () => {
  test('should have valid extension ID', async ({ extensionId }) => {
    // Extension IDs are 32 characters long and contain letters a-p
    expect(extensionId).toMatch(/^[a-p]{32}$/);
  });

  test('should maintain consistent extension ID across page loads', async ({ context, extensionId }) => {
    // Store initial extension ID
    const initialId = extensionId;

    // Create a new page and verify extension ID remains the same
    const page = await context.newPage();
    await page.goto('about:blank');
    
    const backgroundPages = context.backgroundPages();
    const newExtensionId = backgroundPages.length ? 
      backgroundPages[0].url().split('/')[2] : 
      'unknown-extension-id';
    
    expect(newExtensionId).toBe(initialId);
  });

  test('should have accessible extension resources', async ({ context, extensionId }) => {
    const page = await context.newPage();
    
    // Try to access extension's manifest
    await page.goto(`chrome-extension://${extensionId}/manifest.json`);
    const content = await page.content();
    expect(content).toContain('manifest_version');
    
    // Try to access extension's popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should handle extension reload correctly', async ({ context, extensionId }) => {
    // Store initial extension ID
    const initialId = extensionId;
    
    // Simulate extension reload by creating a new context
    await context.close();
    
    const pathToExtension = require('path').join(__dirname, '../../../extension');
    const newContext = await chromium.launchPersistentContext('', {
      headless: true,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    
    const backgroundPages = newContext.backgroundPages();
    const newExtensionId = backgroundPages.length ? 
      backgroundPages[0].url().split('/')[2] : 
      'unknown-extension-id';
    
    // Extension ID should be consistent even after reload
    expect(newExtensionId).toBe(initialId);
    
    await newContext.close();
  });
});
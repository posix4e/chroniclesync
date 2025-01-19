import { test, expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  test('extension content should load correctly', async ({ page }) => {
    // Open the extension page directly
    await page.goto('file://' + process.cwd() + '/../extension/popup.html');

    // Wait for the root element to be visible
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();

    // Check for specific app content
    await expect(page.locator('h1')).toHaveText('ChronicleSync');
    await expect(page.locator('#adminLogin > h2')).toHaveText('Admin Login');
    await expect(page.locator('#adminLogin')).toBeVisible();

    // Check for React-specific attributes and content
    const reactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/extension-window.png',
      fullPage: true
    });
  });
});
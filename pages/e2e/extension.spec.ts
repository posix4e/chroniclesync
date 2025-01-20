import { test, expect } from './utils/extension';

test.describe('Chrome Extension', () => {
  test('should load without errors', async ({ page, context }) => {
    // Check for any console errors
    const errors: string[] = [];
    context.on('weberror', error => {
      errors.push(error.error().message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any immediate errors
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('extension window should load React app correctly', async ({ context }) => {
    // Open extension window directly from extension directory
    const extensionPage = await context.newPage();
    await extensionPage.goto(`file://${process.cwd()}/../extension/index.html`);

    // Wait for the root element to be visible
    const rootElement = await extensionPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Wait for React to mount and render content
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.waitForTimeout(1000); // Give React a moment to hydrate

    // Check for specific app content
    await expect(extensionPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(extensionPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(extensionPage.locator('#adminLogin')).toBeVisible();

    // Check for React-specific attributes and content
    const reactRoot = await extensionPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // Check for console errors
    const errors: string[] = [];
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await extensionPage.waitForTimeout(1000);
    expect(errors).toEqual([]);

    // Take a screenshot of the extension window
    await extensionPage.screenshot({
      path: 'test-results/extension-window.png',
      fullPage: true
    });
  });
});
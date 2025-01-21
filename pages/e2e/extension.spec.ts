import { test, expect } from './utils/extension';

test.describe('Chrome Extension', () => {
  test('popup should load React app correctly', async ({ context, extensionId }) => {
    // Open extension popup using the extension ID
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');

    // Wait for the root element to be visible
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');

    // Check for specific app content
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');

    // Check for React-specific attributes
    const hasReactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.children.length > 0;
    });
    expect(hasReactRoot).toBeTruthy();

    // Check for console errors
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await popupPage.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
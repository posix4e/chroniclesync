import { test } from './utils/extension-test';
import { expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  test('background script should track active tab', async ({ context }) => {
    // Create a mock page
    const page = await context.newPage();
    await page.setContent('<h1>Mock Page</h1>');
    const mockUrl = page.url();
    
    // Get the background page
    const backgroundPage = await context.backgroundPages()[0];
    if (!backgroundPage) {
      throw new Error('Background page not found');
    }

    // Verify the background script is tracking the tab
    const currentTab = await backgroundPage.evaluate(() => {
      return new Promise<chrome.tabs.Tab>(resolve => {
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, response => {
          resolve(response.tab);
        });
      });
    });

    expect(currentTab).toBeTruthy();
    expect(currentTab?.url).toBe(mockUrl);
  });

  test('popup should load correctly', async ({ context }) => {
    // Create a mock page
    const page = await context.newPage();
    await page.setContent('<h1>Mock Page</h1>');

    // Open extension popup
    const popupPage = await context.newPage();
    const backgroundPages = await context.backgroundPages();
    if (!backgroundPages.length) {
      throw new Error('Background page not found');
    }
    await popupPage.goto(`chrome-extension://${backgroundPages[0].url().split('/')[2]}/popup.html`);

    // Wait for React app to load
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Verify basic UI elements
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();

    // Check for console errors
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await popupPage.waitForTimeout(1000);
    expect(errors).toEqual([]);

    // Take a screenshot for CI artifacts
    await popupPage.screenshot({
      path: 'test-results/extension-popup.png',
      fullPage: true
    });
  });
});
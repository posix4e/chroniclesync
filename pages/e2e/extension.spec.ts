import { test, expect } from './utils/extension';
import { server } from '../config';

test.describe('Chrome Extension', () => {
  test('extension should be loaded with correct ID', async ({ context, extensionId }) => {
    // Verify we got a valid extension ID
    expect(extensionId).not.toBe('unknown-extension-id');
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    console.log('Extension loaded with ID:', extensionId);

    // Open a new page to trigger the background script
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.waitForTimeout(1000);

    // Check for service workers
    const workers = await context.serviceWorkers();
    expect(workers.length).toBe(1);

    // Verify the service worker URL matches our extension
    const workerUrl = workers[0].url();
    expect(workerUrl).toContain(extensionId);
    expect(workerUrl).toContain('background');
  });

  test('API health check should be successful', async ({ page }) => {
    const apiUrl = process.env.API_URL || server.apiUrl;
    console.log('Testing API health at:', `${apiUrl}/health`);
    
    const healthResponse = await page.request.get(`${apiUrl}/health`);
    console.log('Health check status:', healthResponse.status());
    
    const responseBody = await healthResponse.json();
    console.log('Health check response:', responseBody);
    
    expect(healthResponse.ok()).toBeTruthy();
    expect(responseBody.healthy).toBeTruthy();
  });
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

  test('popup should load React app correctly', async ({ context }) => {
    // Open extension popup directly from extension directory
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Wait for the root element to be visible
    const rootElement = await popupPage.locator('#root');
    await expect(rootElement).toBeVisible();

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForTimeout(1000); // Give React a moment to hydrate

    // Check for specific app content
    await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
    await expect(popupPage.locator('#adminLogin h2')).toHaveText('Admin Login');
    await expect(popupPage.locator('#adminLogin')).toBeVisible();

    // Check for React-specific attributes and content
    const reactRoot = await popupPage.evaluate(() => {
      const root = document.getElementById('root');
      return root?.hasAttribute('data-reactroot') ||
             (root?.children.length ?? 0) > 0;
    });
    expect(reactRoot).toBeTruthy();

    // Check for console errors
    const errors: string[] = [];
    popupPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await popupPage.waitForTimeout(1000);
    expect(errors).toEqual([]);

    // Take a screenshot of the popup
    await popupPage.screenshot({
      path: 'test-results/extension-popup.png',
      fullPage: true
    });
  });

  test('history sync should work correctly', async ({ context, extensionId }) => {
    // Create a page and navigate to some test URLs
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.goto('https://test.com');
    await page.waitForTimeout(1000); // Wait for history to be recorded

    // Open extension popup
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for history sync to complete and history list to be visible
    await popup.waitForSelector('[data-testid="history-list"]');

    // Verify history items are displayed
    const historyItems = await popup.locator('[data-testid="history-item"]').count();
    expect(historyItems).toBeGreaterThan(0);

    // Verify specific history entries
    const historyUrls = await popup.locator('[data-testid="history-url"]').allTextContents();
    expect(historyUrls).toContain('https://example.com');
    expect(historyUrls).toContain('https://test.com');

    // Test delete functionality
    await popup.locator('[data-testid="delete-history-item"]').first().click();
    const newHistoryItems = await popup.locator('[data-testid="history-item"]').count();
    expect(newHistoryItems).toBe(historyItems - 1);

    // Test clear all functionality
    await popup.locator('[data-testid="clear-history"]').click();
    await popup.locator('[data-testid="confirm-clear"]').click();
    const finalHistoryItems = await popup.locator('[data-testid="history-item"]').count();
    expect(finalHistoryItems).toBe(0);

    // Take a screenshot of the history view
    await popup.screenshot({
      path: 'test-results/history-view.png',
      fullPage: true
    });
  });
});
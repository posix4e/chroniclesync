import { test, expect } from '@playwright/test';
import { BasePage } from './utils/base';

test.describe('History View', () => {
  const initializeClient = async (page: BasePage, clientId: string) => {
    await page.locator('#clientId').fill(clientId);
    await page.locator('button:text("Initialize")').click();
    await page.waitForTimeout(2000); // Wait for initialization to complete
    await page.locator('#dataSection').waitFor({ state: 'visible' }); // Wait for data section to appear
  };

  let page: BasePage;
  const testClientId = 'test-history-client';
  const mockHistoryData = {
    history: [
      {
        url: 'https://example.com',
        title: 'Example Website',
        visitTime: Date.now() - 1000 * 60 * 5, // 5 minutes ago
        visitCount: 3,
        deviceId: 'test-device-1',
        platform: 'MacIntel',
        browserName: 'Chrome',
        browserVersion: '120.0.0'
      },
      {
        url: 'https://github.com',
        title: 'GitHub',
        visitTime: Date.now() - 1000 * 60 * 10, // 10 minutes ago
        visitCount: 5,
        deviceId: 'test-device-1',
        platform: 'MacIntel',
        browserName: 'Chrome',
        browserVersion: '120.0.0'
      }
    ]
  };

  test.beforeEach(async ({ page: _page }) => {
    page = new BasePage(_page);
    
    // Listen for console messages
    _page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    // Mock the API response for history data
    await page.route(`http://localhost:59399?clientId=${testClientId}`, async (route) => {
      console.log('Mocking API response for:', route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistoryData)
      });
    });

    await page.goto('/');
  });

  test('displays history view after client initialization', async () => {
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/history-view-initial.png' });

    // Initialize client
    await initializeClient(page, testClientId);
    
    // Wait for data section and history view to appear
    await page.locator('#dataSection').waitFor({ state: 'visible' });
    await page.locator('.history-view').waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: 'test-results/history-view-loaded.png' });

    // Verify history entries are displayed
    const historyItems = await page.locator('.history-item').all();
    expect(historyItems).toHaveLength(2);

    // Test sorting by visit count
    await page.locator('button:text("Sort by Visits")').click();
    await page.screenshot({ path: 'test-results/history-view-sorted-visits.png' });

    // Test sorting by time
    await page.locator('button:text("Sort by Time")').click();
    await page.screenshot({ path: 'test-results/history-view-sorted-time.png' });
  });

  test('handles empty history data', async () => {
    // Override the mock to return empty history
    await page.route(`http://localhost:59399?clientId=${testClientId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [] })
      });
    });

    // Initialize client
    await initializeClient(page, testClientId);
    
    // Wait for data section and history view to appear
    await page.locator('#dataSection').waitFor({ state: 'visible' });
    await page.locator('.history-view').waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: 'test-results/history-view-empty.png' });

    // Verify no history items are displayed
    const historyItems = await page.locator('.history-item').all();
    expect(historyItems).toHaveLength(0);
  });

  test('handles API errors gracefully', async () => {
    // Override the mock to return an error
    await page.route(`http://localhost:59399?clientId=${testClientId}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Initialize client
    await initializeClient(page, testClientId);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/history-view-error.png' });

    // Verify error message is displayed
    await expect(page.locator('text=Error')).toBeVisible();
  });
});
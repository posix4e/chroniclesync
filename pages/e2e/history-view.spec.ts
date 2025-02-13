import { test, expect } from '@playwright/test';
import { BasePage } from './utils/base';

test.describe('History View', () => {
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
    
    // Mock the API response for history data
    await page.route(`**/api?clientId=${testClientId}`, async (route) => {
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

    // Enter client ID and initialize
    await page.locator('#clientId').fill(testClientId);
    await page.locator('button:text("Initialize")').click();
    
    // Wait for history view to appear
    await page.locator('.history-view').waitFor();
    
    // Take screenshot after initialization
    await page.screenshot({ path: 'test-results/history-view-loaded.png' });

    // Verify history entries are displayed
    const historyItems = await page.locator('.history-item').all();
    expect(historyItems).toHaveLength(2);

    // Verify first history item content
    const firstItem = historyItems[0];
    await expect(firstItem.locator('.history-title a')).toHaveText('Example Website');
    await expect(firstItem.locator('.history-title a')).toHaveAttribute('href', 'https://example.com');

    // Test sorting by visit count
    await page.locator('button:text("Sort by Visits")').click();
    await page.screenshot({ path: 'test-results/history-view-sorted-visits.png' });

    // Verify sorting changed the order (GitHub should be first with 5 visits)
    const sortedItems = await page.locator('.history-item').all();
    const firstItemAfterSort = sortedItems[0];
    await expect(firstItemAfterSort.locator('.history-title a')).toHaveText('GitHub');

    // Test sorting by time
    await page.locator('button:text("Sort by Time")').click();
    await page.screenshot({ path: 'test-results/history-view-sorted-time.png' });

    // Verify metadata is displayed
    const metadataText = await firstItem.locator('.history-meta').innerText();
    expect(metadataText).toContain('Chrome');
    expect(metadataText).toContain('test-device-1');
    expect(metadataText).toContain('Visit count: ');
  });

  test('handles empty history data', async () => {
    // Override the mock to return empty history
    await page.route(`**/api?clientId=${testClientId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [] })
      });
    });

    // Enter client ID and initialize
    await page.locator('#clientId').fill(testClientId);
    await page.locator('button:text("Initialize")').click();
    
    // Wait for history view to appear
    await page.locator('.history-view').waitFor();
    
    // Take screenshot of empty state
    await page.screenshot({ path: 'test-results/history-view-empty.png' });

    // Verify no history items are displayed
    const historyItems = await page.locator('.history-item').all();
    expect(historyItems).toHaveLength(0);
  });

  test('handles API errors gracefully', async () => {
    // Override the mock to return an error
    await page.route(`**/api?clientId=${testClientId}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Enter client ID and initialize
    await page.locator('#clientId').fill(testClientId);
    await page.locator('button:text("Initialize")').click();
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/history-view-error.png' });

    // Verify error message is displayed
    await expect(page.locator('text=Error')).toBeVisible();
  });
});
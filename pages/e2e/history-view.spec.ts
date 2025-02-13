import { test, expect } from '@playwright/test';
import { server } from '../config';

test.describe('History View', () => {
  const mockHistoryData = [
    {
      url: 'https://example.com',
      title: 'Example Site',
      visitTime: Date.now(),
      visitCount: 5,
      deviceId: 'device_123',
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      browserName: 'Chrome',
      browserVersion: '120.0.0.0'
    }
  ];

  test.beforeEach(async ({ page }) => {
    // Mock the history API response
    await page.route('**/api/history', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistoryData)
      });
    });

    // Go to the admin panel page and wait for it to be ready
    await page.goto(server.webUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input[type="password"]');
  });

  test('history view is not visible before login', async ({ page }) => {
    const historyView = page.locator('.history-view');
    await expect(historyView).not.toBeVisible();
  });

  test('history view displays correctly after login', async ({ page }) => {
    // Login with the correct password
    await page.fill('input[type="password"]', 'francesisthebest');
    await page.click('button:has-text("Login")');

    // Check history view becomes visible
    const historyView = page.locator('.history-view');
    await expect(historyView).toBeVisible();

    // Check history entry content
    const historyItem = historyView.locator('.history-item').first();
    await expect(historyItem.locator('.history-item-content a')).toHaveAttribute('href', mockHistoryData[0].url);
    await expect(historyItem.locator('.history-item-content a')).toHaveText(mockHistoryData[0].title);
    await expect(historyItem.locator('.visit-count')).toContainText(String(mockHistoryData[0].visitCount));
    await expect(historyItem.locator('.device-info')).toContainText(mockHistoryData[0].browserName);
    await expect(historyItem.locator('.device-id')).toContainText(mockHistoryData[0].deviceId);
  });

  test('history view shows loading state', async ({ page }) => {
    // Create a promise that we'll resolve later
    let resolveResponse: () => void;
    const responsePromise = new Promise<void>(resolve => {
      resolveResponse = resolve;
    });

    // Mock slow API response
    await page.route('**/api/history', async route => {
      await responsePromise;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistoryData)
      });
    });

    // Login with the correct password
    await page.fill('input[type="password"]', 'francesisthebest');
    await page.click('button:has-text("Login")');

    // Check loading state before resolving the response
    await expect(page.locator('.history-view')).toContainText('Loading');

    // Now resolve the response
    resolveResponse!();
  });

  test('history view shows error state', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/history', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Login with the correct password
    await page.fill('input[type="password"]', 'francesisthebest');
    await page.click('button:has-text("Login")');

    // Check error state
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Failed to load history');
  });
});
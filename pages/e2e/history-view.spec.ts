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

    // Go to the admin panel page
    await page.goto(server.webUrl);
  });

  test('history view is not visible before login', async ({ page }) => {
    const historyView = page.locator('.history-view');
    await expect(historyView).not.toBeVisible();
  });

  test('history view displays correctly after login', async ({ page }) => {
    // Mock successful login
    await page.route('**/admin/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Login
    await page.fill('input[type="password"]', 'admin-password');
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
    // Mock slow API response
    await page.route('**/api/history', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockHistoryData)
      });
    });

    // Mock successful login
    await page.route('**/admin/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Login
    await page.fill('input[type="password"]', 'admin-password');
    await page.click('button:has-text("Login")');

    // Check loading state
    await expect(page.locator('.history-view')).toContainText('Loading');
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

    // Mock successful login
    await page.route('**/admin/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Login
    await page.fill('input[type="password"]', 'admin-password');
    await page.click('button:has-text("Login")');

    // Check error state
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Failed to load history');
  });
});
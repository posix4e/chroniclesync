import { test, expect } from '@playwright/test';
import { server } from '../config';

test('history view displays browser history', async ({ page }) => {
  // Mock the API response
  await page.route('**/history?clientId=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        history: [
          {
            url: 'https://example.com',
            title: 'Example Website',
            visitTime: Date.now(),
            visitCount: 1,
            deviceId: 'test-device',
            platform: 'Win32',
            userAgent: 'Chrome',
            browserName: 'Chrome',
            browserVersion: '100.0.0'
          }
        ],
        deviceInfo: {
          deviceId: 'test-device',
          platform: 'Win32',
          userAgent: 'Chrome',
          browserName: 'Chrome',
          browserVersion: '100.0.0'
        }
      })
    });
  });

  // First visit home page to set client ID
  await page.goto(server.webUrl);
  await page.fill('#clientId', 'test-client-id');
  await page.click('text=Initialize');
  await page.screenshot({ path: 'test-results/history-view-home.png' });

  // Visit history page
  await page.click('text=History');
  await page.screenshot({ path: 'test-results/history-view-initial.png' });

  // Wait for the history to load
  await page.waitForSelector('[data-testid="history-view"]', { timeout: 10000 });
  
  // Take a screenshot after the history has loaded
  await page.screenshot({ path: 'test-results/history-view-loaded.png' });

  // Verify history content
  const historyItem = page.locator('[data-testid="history-item"]').first();
  await expect(historyItem).toContainText('Example Website');
  await expect(historyItem).toContainText('https://example.com');
  await expect(historyItem).toContainText('Chrome 100.0.0');
});

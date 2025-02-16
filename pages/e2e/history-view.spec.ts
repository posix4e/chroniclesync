import { test, expect } from '@playwright/test';

test('history view displays browser history', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });
  // Mock the API response
  await page.route('**/history**', async (route) => {
    console.log('Mocking API request:', route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        history: [
          {
            url: 'https://example.com',
            title: 'Example Website',
            encrypted: false,
            visitTime: Date.now(),
            visitCount: 1,
            deviceId: 'test-device',
            platform: 'Win32',
            userAgent: 'Chrome',
            browserName: 'Chrome',
            browserVersion: '100.0.0',
            encrypted: false // Add this to skip encryption
          }
        ],
        deviceInfo: {
          deviceId: 'test-device',
          platform: 'Win32',
          userAgent: 'Chrome',
          browserName: 'Chrome',
          browserVersion: '100.0.0'
        },
        pagination: {
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      })
    });
  });

  // First visit home page to set client ID
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#clientId');
  await page.fill('#clientId', '0123456789abcdef0123456789abcdef');
  await page.click('text=Initialize');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/history-view-home.png' });

  // Wait for and click the History link
  await page.waitForSelector('text=History', { state: 'visible' });
  await page.click('text=History');
  await page.screenshot({ path: 'test-results/history-view-initial.png' });

  // Wait for the history to load
  await page.waitForSelector('[data-testid="history-view"]', { timeout: 10000 });
  
  // Wait for loading state to be gone
  await page.waitForSelector('text=Loading history...', { state: 'hidden', timeout: 10000 });
  
  // Take a screenshot after the history has loaded
  await page.screenshot({ path: 'test-results/history-view-loaded.png' });

  // Verify history content
  const historyItem = page.locator('[data-testid="history-item"]').first();
  await expect(historyItem).toContainText('Example Website');
  await expect(historyItem).toContainText('https://example.com');
  await expect(historyItem).toContainText('Chrome 100.0.0');
});
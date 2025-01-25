import { test, expect } from './utils/extension';

test.describe('History Sync Feature', () => {
  test('should sync history across browsers', async ({ context, extensionId }) => {
    // Mock the API responses
    await context.route('**/*', async (route, request) => {
      if (request.url().includes('chroniclesync.xyz/history')) {
        if (request.method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'History saved' })
          });
        } else if (request.method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                url: 'https://example.com',
                title: 'Example Domain',
                timestamp: Date.now() - 1000,
                deviceId: 'device1',
                deviceInfo: {
                  platform: 'Windows',
                  browser: 'Chrome',
                  version: '120.0.0'
                }
              },
              {
                url: 'https://test.com',
                title: 'Test Site',
                timestamp: Date.now(),
                deviceId: 'device2',
                deviceInfo: {
                  platform: 'MacOS',
                  browser: 'Chrome',
                  version: '120.0.0'
                }
              }
            ])
          });
        }
      } else {
        await route.continue();
      }
    });

    // Open extension popup
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('networkidle');

    // Switch to history tab
    await extensionPage.click('button:has-text("History")');
    await extensionPage.waitForTimeout(1000);

    // Verify history entries
    const historyItems = await extensionPage.locator('.history-item').count();
    expect(historyItems).toBe(2);

    // Verify device filtering
    const deviceSelect = await extensionPage.locator('select');
    await deviceSelect.selectOption({ index: 1 }); // First device
    await extensionPage.waitForTimeout(500);
    const filteredItems = await extensionPage.locator('.history-item').count();
    expect(filteredItems).toBe(1);

    // Take a screenshot
    await extensionPage.screenshot({
      path: 'test-results/history-sync.png',
      fullPage: true
    });
  });

  test('history should sync in real-time', async ({ context, extensionId }) => {
    const errors: string[] = [];
    const extensionPage = await context.newPage();
    extensionPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Mock API responses
    await extensionPage.route('**/*', async (route, request) => {
      if (request.url().includes('chroniclesync.xyz/history')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'History saved' })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to test pages
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.waitForTimeout(1000);

    // Open extension and check history
    await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await extensionPage.waitForLoadState('networkidle');
    await extensionPage.click('button:has-text("History")');
    await extensionPage.waitForTimeout(1000);

    // Verify no errors occurred
    expect(errors).toEqual([]);

    // Take a screenshot
    await extensionPage.screenshot({
      path: 'test-results/history-sync-realtime.png',
      fullPage: true
    });
  });
});
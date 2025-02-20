import { test, expect, chromium } from '@playwright/test';

test.describe('History Viewer', () => {
  test('should display history and sync status', async ({ page }) => {
    // Mock extension API
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: {
            addListener: () => {}
          },
          sendMessage: () => {}
        },
        storage: {
          local: {
            get: (key: string, callback: Function) => {
              callback({
                history: [
                  {
                    id: '1',
                    url: 'https://example.com',
                    title: 'Example Site',
                    lastVisitTime: new Date().toISOString(),
                    visitCount: 1
                  }
                ]
              });
            }
          }
        }
      } as any;
    });

    await page.goto('chrome-extension://extension-id/pages/history/history.html');

    // Check if the page loads correctly
    await expect(page.locator('h1')).toHaveText('History Viewer');

    // Check if history item is displayed
    const historyItem = page.locator('.history-item');
    await expect(historyItem).toBeVisible();
    await expect(historyItem.locator('.title')).toHaveText('Example Site');
    await expect(historyItem.locator('.url')).toHaveText('https://example.com');

    // Test search functionality
    const searchInput = page.locator('#search');
    await searchInput.fill('example');
    await expect(historyItem).toBeVisible();
    await searchInput.fill('nonexistent');
    await expect(historyItem).not.toBeVisible();

    // Test time filter
    const timeFilter = page.locator('#timeFilter');
    await timeFilter.selectOption('today');
    await expect(historyItem).toBeVisible();
  });

  test('should handle offline state', async ({ page }) => {
    // Mock offline state
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });
    });

    await page.goto('chrome-extension://extension-id/pages/history/history.html');

    // Check if offline notice is displayed
    const offlineNotice = page.locator('.offline-notice');
    await expect(offlineNotice).toBeVisible();
    await expect(offlineNotice).toContainText('You're offline');

    // Check sync indicator state
    const syncIndicator = page.locator('.sync-indicator');
    await expect(syncIndicator).toHaveClass(/offline/);
  });

  test('should handle sync events', async ({ page }) => {
    await page.goto('chrome-extension://extension-id/pages/history/history.html');

    // Simulate sync event
    await page.evaluate(() => {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'sync-event') {
          // Handle sync event
        }
      });

      // Dispatch sync event
      chrome.runtime.sendMessage({
        type: 'sync-event',
        event: 'sync-complete',
        data: { success: true }
      });
    });

    // Check if sync status is updated
    const syncText = page.locator('#sync-text');
    await expect(syncText).not.toContainText('Never synced');
  });
});

test.describe('History Sync Integration', () => {
  test('should sync history with server', async ({ page, request }) => {
    // Mock server endpoints
    const mockServer = {
      async fetch(url: string) {
        if (url.includes('/changes')) {
          return {
            ok: true,
            json: async () => ([
              {
                id: '2',
                url: 'https://remote-example.com',
                title: 'Remote Example',
                lastVisitTime: new Date().toISOString(),
                visitCount: 1
              }
            ])
          };
        }
        return { ok: true, json: async () => ({}) };
      }
    };

    // Mock fetch API
    await page.addInitScript((mockServer) => {
      window.fetch = (url: string) => mockServer.fetch(url);
    }, mockServer);

    await page.goto('chrome-extension://extension-id/pages/history/history.html');

    // Wait for sync to complete
    await page.waitForSelector('.sync-indicator:not(.syncing)');

    // Verify both local and remote history items are displayed
    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(2);
    await expect(historyItems.nth(0)).toContainText('Remote Example');
    await expect(historyItems.nth(1)).toContainText('Example Site');
  });
});
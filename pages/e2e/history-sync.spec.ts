import { test, expect, chromium } from '@playwright/test';

test.describe('History Synchronization', () => {
  test('should sync browsing history between multiple browsers', async ({ page }) => {
    // Launch two browser instances to simulate different machines
    const browser1 = await chromium.launch();
    const browser2 = await chromium.launch();

    try {
      // Set up first browser
      const context1 = await browser1.newContext();
      const page1 = await context1.newPage();
      await page1.goto('https://example.com');
      await page1.screenshot({ path: 'test-results/browser1-visit1.png' });

      // Wait for sync
      await page.waitForTimeout(2000);

      // Set up second browser
      const context2 = await browser2.newContext();
      const page2 = await context2.newPage();
      await page2.goto('https://mozilla.org');
      await page2.screenshot({ path: 'test-results/browser2-visit1.png' });

      // Wait for sync
      await page.waitForTimeout(2000);

      // Check history in first browser
      const [history1] = await Promise.all([
        context1.waitForEvent('dialog'),
        page1.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      // Check history in second browser
      const [history2] = await Promise.all([
        context2.waitForEvent('dialog'),
        page2.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      // Take screenshots of history in both browsers
      await page1.screenshot({ path: 'test-results/browser1-history.png' });
      await page2.screenshot({ path: 'test-results/browser2-history.png' });

      // Verify history entries
      expect(history1).toContainEqual(expect.objectContaining({ url: 'https://example.com' }));
      expect(history1).toContainEqual(expect.objectContaining({ url: 'https://mozilla.org' }));
      expect(history2).toContainEqual(expect.objectContaining({ url: 'https://example.com' }));
      expect(history2).toContainEqual(expect.objectContaining({ url: 'https://mozilla.org' }));

      // Test history deletion
      await page1.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ 
            type: 'DELETE_HISTORY',
            url: 'https://example.com'
          }, resolve);
        });
      });

      // Wait for sync
      await page.waitForTimeout(2000);

      // Take screenshots after deletion
      await page1.screenshot({ path: 'test-results/browser1-after-delete.png' });
      await page2.screenshot({ path: 'test-results/browser2-after-delete.png' });

      // Verify deletion in both browsers
      const [historyAfterDelete1] = await Promise.all([
        context1.waitForEvent('dialog'),
        page1.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      const [historyAfterDelete2] = await Promise.all([
        context2.waitForEvent('dialog'),
        page2.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      expect(historyAfterDelete1).not.toContainEqual(expect.objectContaining({ url: 'https://example.com' }));
      expect(historyAfterDelete2).not.toContainEqual(expect.objectContaining({ url: 'https://example.com' }));

      // Test clear history
      await page2.evaluate(() => {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, resolve);
        });
      });

      // Wait for sync
      await page.waitForTimeout(2000);

      // Take screenshots after clearing
      await page1.screenshot({ path: 'test-results/browser1-after-clear.png' });
      await page2.screenshot({ path: 'test-results/browser2-after-clear.png' });

      // Verify history is cleared in both browsers
      const [historyAfterClear1] = await Promise.all([
        context1.waitForEvent('dialog'),
        page1.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      const [historyAfterClear2] = await Promise.all([
        context2.waitForEvent('dialog'),
        page2.evaluate(() => {
          return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
              resolve(history);
            });
          });
        })
      ]);

      expect(historyAfterClear1).toHaveLength(0);
      expect(historyAfterClear2).toHaveLength(0);

    } finally {
      await browser1.close();
      await browser2.close();
    }
  });
});
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Browser History Visual Tests', () => {
  test('should synchronize history between two browsers', async ({ context }) => {
    // Create two browser pages
    const browser1 = await context.newPage();
    const browser2 = await context.newPage();

    // Load the extension in both browsers
    await browser1.goto('chrome-extension://extension-id/popup.html');
    await browser2.goto('chrome-extension://extension-id/popup.html');

    // Take screenshots of initial state
    const screenshotDir = path.join(process.cwd(), 'test-results/browser-history');
    await browser1.screenshot({ path: path.join(screenshotDir, 'browser1-initial-history.png') });
    await browser2.screenshot({ path: path.join(screenshotDir, 'browser2-initial-history.png') });

    // Navigate in browser1 while browser2 is offline
    await context.setOffline(true);
    
    await browser1.goto('https://example.com/page1');
    await browser1.goto('https://example.com/page2');
    
    // Take screenshots of divergent state
    await browser1.screenshot({ path: path.join(screenshotDir, 'browser1-offline-state.png') });
    await browser2.screenshot({ path: path.join(screenshotDir, 'browser2-offline-state.png') });

    // Bring browser2 back online and wait for sync
    await context.setOffline(false);
    await browser2.waitForSelector('[data-testid="history-entry"]');

    // Take screenshots of final synchronized state
    await browser1.screenshot({ path: path.join(screenshotDir, 'browser1-after-merge.png') });
    await browser2.screenshot({ path: path.join(screenshotDir, 'browser2-after-merge.png') });

    // Verify history entries match
    const history1 = await browser1.$$eval('[data-testid="history-entry"]', 
      entries => entries.map(e => ({
        action: e.querySelector('[data-testid="history-action"]')?.textContent,
        data: e.querySelector('[data-testid="history-data"]')?.textContent
      }))
    );

    const history2 = await browser2.$$eval('[data-testid="history-entry"]',
      entries => entries.map(e => ({
        action: e.querySelector('[data-testid="history-action"]')?.textContent,
        data: e.querySelector('[data-testid="history-data"]')?.textContent
      }))
    );

    expect(history1).toEqual(history2);
  });

  test('should handle History API operations correctly', async ({ page }) => {
    await page.goto('chrome-extension://extension-id/popup.html');

    // Take screenshot of initial state
    const screenshotDir = path.join(process.cwd(), 'test-results');
    await page.screenshot({ path: path.join(screenshotDir, 'history-api-initial.png') });

    // Perform history operations
    await page.evaluate(() => {
      history.pushState({ page: 1 }, 'Page 1', '/page1');
      history.pushState({ page: 2 }, 'Page 2', '/page2');
      history.back();
    });

    // Wait for history to update
    await page.waitForTimeout(1000);

    // Take screenshot after operations
    await page.screenshot({ path: path.join(screenshotDir, 'history-api-after-back.png') });

    // Verify history entries
    const entries = await page.$$eval('[data-testid="history-entry"]',
      entries => entries.map(e => ({
        action: e.querySelector('[data-testid="history-action"]')?.textContent,
        data: e.querySelector('[data-testid="history-data"]')?.textContent
      }))
    );

    expect(entries).toContainEqual({
      action: 'pushState',
      data: expect.stringContaining('/page1')
    });
    expect(entries).toContainEqual({
      action: 'pushState',
      data: expect.stringContaining('/page2')
    });
    expect(entries).toContainEqual({
      action: 'popstate',
      data: expect.stringContaining('/page1')
    });
  });
});
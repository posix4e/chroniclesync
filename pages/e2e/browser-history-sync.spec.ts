import { test, expect } from './utils/extension';
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface HistoryEntry {
  timestamp: number;
  action: string;
  data: {
    url?: string;
    [key: string]: unknown;
  };
  clientId: string;
  synced: boolean;
}

interface NavigationEntry extends HistoryEntry {
  type: 'navigation' | 'pushState' | 'replaceState' | 'popstate';
  data: {
    url: string;
    [key: string]: unknown;
  };
}

// Helper function to convert DB entry to NavigationEntry in page context
function getNavigationEntries() {
  return async () => {
    const entries = await window.chronicleSync.db.getHistory();
    return entries.map(entry => {
      const data = typeof entry.data === 'object' && entry.data
        ? { ...(entry.data as object) }
        : {};
      
      return {
        ...entry,
        type: entry.action,
        data: {
          ...data,
          url: (entry.data as { url?: string })?.url || ''
        }
      };
    });
  };
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-results', 'browser-history');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Browser History Sync', () => {
  test('should sync browser history between different browser instances', async ({ context, extensionId }) => {
    // Create two pages in the same context (which has the extension loaded)
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await Promise.all([
      page1.goto(`chrome-extension://${extensionId}/popup.html`),
      page2.goto(`chrome-extension://${extensionId}/popup.html`)
    ]);

    // Wait for the extension to be ready in both pages
    await Promise.all([
      page1.waitForFunction(() => window.chronicleSync && window.chronicleSync.db),
      page2.waitForFunction(() => window.chronicleSync && window.chronicleSync.db)
    ]);

    // Initialize clients with different IDs
    await Promise.all([
      page1.evaluate(() => window.chronicleSync.db.init('browser1')),
      page2.evaluate(() => window.chronicleSync.db.init('browser2'))
    ]);

    // Navigate in browser1 and verify history is recorded
    await page1.goto('https://example.com');
    await page1.goto('https://example.org');
    await page1.waitForTimeout(1000);

    // Take screenshots of both browsers' history views
    await page1.bringToFront();
    await page1.screenshot({ 
      path: path.join(screenshotsDir, 'browser1-initial-history.png'),
      fullPage: true 
    });
    
    await page2.bringToFront();
    await page2.screenshot({ 
      path: path.join(screenshotsDir, 'browser2-initial-history.png'),
      fullPage: true 
    });

    // Verify history entries in browser1
    const history1 = await page1.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries.filter(e => e.type === 'navigation');
    });

    expect(history1).toHaveLength(2);
    expect(history1[0].data.url).toBe('https://example.com');
    expect(history1[1].data.url).toBe('https://example.org');

    // Verify history synced to browser2
    const history2 = await page2.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries.filter(e => e.type === 'navigation');
    });

    expect(history2).toHaveLength(2);
    expect(history2[0].data.url).toBe('https://example.com');
    expect(history2[1].data.url).toBe('https://example.org');

    // Navigate in browser2
    await page2.goto('https://example.net');
    await page2.waitForTimeout(1000);

    // Verify new history entry synced back to browser1
    const updatedHistory1 = await page1.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries.filter(e => e.type === 'navigation');
    });

    expect(updatedHistory1).toHaveLength(3);
    expect(updatedHistory1[2].data.url).toBe('https://example.net');
  });

  test('should handle offline/online sync scenarios', async ({ context, extensionId }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await Promise.all([
      page1.goto(`chrome-extension://${extensionId}/popup.html`),
      page2.goto(`chrome-extension://${extensionId}/popup.html`)
    ]);

    // Wait for the extension to be ready in both pages
    await Promise.all([
      page1.waitForFunction(() => window.chronicleSync && window.chronicleSync.db),
      page2.waitForFunction(() => window.chronicleSync && window.chronicleSync.db)
    ]);

    // Initialize clients
    await Promise.all([
      page1.evaluate(() => window.chronicleSync.db.init('offline-test-1')),
      page2.evaluate(() => window.chronicleSync.db.init('offline-test-2'))
    ]);

    // Disconnect browser2
    await context.setOffline(true);

    // Navigate in both browsers
    await page1.goto('https://example.com');
    await page2.goto('https://example.org');
    
    await page1.waitForTimeout(1000);

    // Verify histories are separate while offline
    const [history1Offline, history2Offline] = await Promise.all([
      page1.evaluate(async () => {
        const entries = await getNavigationEntries()();
        return entries.filter(e => e.type === 'navigation');
      }),
      page2.evaluate(async () => {
        const entries = await getNavigationEntries()();
        return entries.filter(e => e.type === 'navigation');
      })
    ]);

    expect(history1Offline).toHaveLength(1);
    expect(history1Offline[0].data.url).toBe('https://example.com');
    expect(history2Offline).toHaveLength(1);
    expect(history2Offline[0].data.url).toBe('https://example.org');

    // Take screenshots showing offline state
    await page1.bringToFront();
    await page1.screenshot({ 
      path: path.join(screenshotsDir, 'browser1-offline-state.png'),
      fullPage: true 
    });
    
    await page2.bringToFront();
    await page2.screenshot({ 
      path: path.join(screenshotsDir, 'browser2-offline-state.png'),
      fullPage: true 
    });

    // Reconnect browser2 and wait for sync
    await context.setOffline(false);
    await page2.waitForTimeout(2000);

    // Verify histories are merged
    const [history1Online, history2Online] = await Promise.all([
      page1.evaluate(async () => {
        const entries = await getNavigationEntries()();
        return entries.filter(e => e.type === 'navigation');
      }),
      page2.evaluate(async () => {
        const entries = await getNavigationEntries()();
        return entries.filter(e => e.type === 'navigation');
      })
    ]);

    // Take screenshots after merge
    await page1.bringToFront();
    await page1.screenshot({ 
      path: path.join(screenshotsDir, 'browser1-after-merge.png'),
      fullPage: true 
    });
    
    await page2.bringToFront();
    await page2.screenshot({ 
      path: path.join(screenshotsDir, 'browser2-after-merge.png'),
      fullPage: true 
    });

    expect(history1Online).toHaveLength(2);
    expect(history2Online).toHaveLength(2);
    expect(history1Online.map(e => e.data.url).sort()).toEqual(['https://example.com', 'https://example.org']);
    expect(history2Online.map(e => e.data.url).sort()).toEqual(['https://example.com', 'https://example.org']);
  });

  test('should handle browser history API integration', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    // Wait for the extension to be ready
    await page.waitForFunction(() => window.chronicleSync && window.chronicleSync.db);

    await page.evaluate(() => window.chronicleSync.db.init('history-api-test'));

    // Test history.pushState
    await page.evaluate(() => {
      history.pushState({ page: 1 }, '', '/page1');
      history.pushState({ page: 2 }, '', '/page2');
    });

    await page.waitForTimeout(1000);

    // Take screenshot of initial history state
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'history-api-initial.png'),
      fullPage: true 
    });

    // Verify pushState entries are recorded
    const pushStateHistory = await page.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries.filter(e => e.type === 'pushState');
    });

    expect(pushStateHistory).toHaveLength(2);
    expect(pushStateHistory[0].data.url).toBe('/page1');
    expect(pushStateHistory[1].data.url).toBe('/page2');

    // Test history.replaceState
    await page.evaluate(() => {
      history.replaceState({ page: 3 }, '', '/page3');
    });

    await page.waitForTimeout(1000);

    // Verify replaceState modifies the last entry
    const replaceStateHistory = await page.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries.filter(e => e.type === 'pushState' || e.type === 'replaceState');
    });

    expect(replaceStateHistory).toHaveLength(2);
    expect(replaceStateHistory[1].data.url).toBe('/page3');

    // Test back/forward navigation
    await page.evaluate(() => {
      history.back();
    });
    await page.waitForTimeout(1000);

    // Take screenshot after back navigation
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'history-api-after-back.png'),
      fullPage: true 
    });

    const backHistory = await page.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries[entries.length - 1];
    });

    expect(backHistory.type).toBe('popstate');
    expect(backHistory.data.url).toBe('/page1');

    await page.evaluate(() => {
      history.forward();
    });
    await page.waitForTimeout(1000);

    const forwardHistory = await page.evaluate(async () => {
      const entries = await getNavigationEntries()();
      return entries[entries.length - 1];
    });

    expect(forwardHistory.type).toBe('popstate');
    expect(forwardHistory.data.url).toBe('/page3');
  });
});
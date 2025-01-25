import { test, expect, Page } from '@playwright/test';

interface HistoryItem {
  id?: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
  typedCount?: number;
  deviceName?: string;
}

interface DeviceInfo {
  id: string;
  platform: string;
  userAgent: string;
  lastSync: number;
  name: string;
}

test('history syncs between browsers', async ({ browser }) => {
  test.setTimeout(120000); // 2 minutes

  // Create two browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  try {
    // Create pages in both contexts
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Create a test page to show history content
    const showHistory = async (page: Page) => {
      await page.goto('about:blank');
      await page.setContent(`
        <h2>Browser History</h2>
        <div id="history"></div>
      `);
      
      const entries = await page.evaluate(() => {
        return new Promise<string>((resolve) => {
          chrome.history.search({ text: '', maxResults: 100 }, (results) => {
            const html = results.map((item: chrome.history.HistoryItem) => `
              <div style="margin-bottom: 1em; border-bottom: 1px solid #eee; padding: 0.5em;">
                <div><strong>${item.title || item.url}</strong></div>
                <div style="color: #666;">${item.url}</div>
                <div style="color: #888; font-size: 0.9em;">
                  Visited: ${new Date(item.lastVisitTime || 0).toLocaleString()}
                  ${(item as any).deviceName ? ` | From: ${(item as any).deviceName}` : ''}
                </div>
              </div>
            `).join('');
            resolve(html);
          });
        });
      });
      
      await page.evaluate((html: string) => {
        const element = document.getElementById('history');
        if (element) {
          element.innerHTML = html;
        }
      }, entries);
      
      return page.screenshot({ path: `history-${Date.now()}.png`, fullPage: true });
    };

    // Capture initial history
    await showHistory(page1);

    // Visit different pages in browser1
    await page1.goto('https://example.com');
    await page1.waitForTimeout(2000); // Wait for sync
    await page1.goto('https://mozilla.org');
    await page1.waitForTimeout(2000); // Wait for sync

    // Show updated history in browser1
    await showHistory(page1);

    // Wait for sync to happen (5 minutes in real extension, reduced for test)
    await page2.waitForTimeout(5000);

    // Show synced history in browser2
    await showHistory(page2);

    // Verify history sync through API
    const response = await page2.evaluate(async () => {
      const res = await fetch('https://api.chroniclesync.xyz/history');
      return res.json() as Promise<HistoryItem[]>;
    });

    // Verify history entries are present
    const urls = response.map((item: HistoryItem) => item.url).filter((url: string | undefined): url is string => url !== undefined);
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://mozilla.org/');

    // Verify device info is stored
    const deviceInfo = await page2.evaluate(() => {
      return chrome.storage.local.get('deviceInfo') as Promise<{ deviceInfo: DeviceInfo }>;
    });
    expect(deviceInfo.deviceInfo).toBeTruthy();
    expect(deviceInfo.deviceInfo.id).toBeTruthy();
    expect(deviceInfo.deviceInfo.platform).toBeTruthy();

  } finally {
    // Clean up
    await context1.close();
    await context2.close();
  }
});
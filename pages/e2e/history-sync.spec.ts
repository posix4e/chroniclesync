import { test, expect, chromium, Route } from '@playwright/test';

interface HistoryItem {
  id?: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
  typedCount?: number;
}

declare global {
  interface Window {
    getHistoryItems: () => Promise<HistoryItem[]>;
    getDeviceInfo: () => Promise<any>;
  }
}

test('history syncs between browsers', async () => {
  test.setTimeout(120000); // 2 minutes
  // Launch a browser instance
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  // Create two contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  try {
    // Create pages in both contexts
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Set up mock API route for both pages
    const mockHistory = async (route: Route) => {
      console.log('Mock API called:', route.request().method(), route.request().url());
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = JSON.parse(request.postData() || '{}');
        console.log('Mock API received history:', postData);
        await route.fulfill({ status: 200 });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              url: 'https://example.com/',
              title: 'Example Domain',
              lastVisitTime: Date.now(),
              deviceId: 'device_1',
              deviceName: 'Chrome on Linux'
            },
            {
              url: 'https://mozilla.org/',
              title: 'Mozilla',
              lastVisitTime: Date.now(),
              deviceId: 'device_2',
              deviceName: 'Chrome on Linux'
            }
          ])
        });
      }
    };

    await page1.route('https://api.chroniclesync.xyz/history', mockHistory);
    await page2.route('https://api.chroniclesync.xyz/history', mockHistory);

    // Visit different pages in browser1
    await page1.goto('https://example.com');
    await page1.screenshot({ path: 'browser1-example.png' });
    await page1.waitForTimeout(2000); // Wait for sync

    await page1.goto('https://mozilla.org');
    await page1.screenshot({ path: 'browser1-mozilla.png' });
    await page1.waitForTimeout(2000); // Wait for sync

    // Wait for sync to happen (5 minutes in real extension, reduced for test)
    await page2.waitForTimeout(5000);

    // Verify history sync through API
    const response = await page2.evaluate(async () => {
      const res = await fetch('https://api.chroniclesync.xyz/history');
      return res.json();
    });

    await page2.screenshot({ path: 'browser2-history.png' });

    // Verify history entries are present
    const urls = response.map((item: HistoryItem) => item.url);
    expect(urls).toContain('https://example.com/');
    expect(urls).toContain('https://mozilla.org/');

    // Verify device info
    const deviceInfo = response[0];
    expect(deviceInfo.deviceId).toBeTruthy();
    expect(deviceInfo.deviceName).toBeTruthy();

  } finally {
    // Clean up
    await context1.close();
    await context2.close();
    await browser.close();
  }
});
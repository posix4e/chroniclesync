import { test, expect } from '@playwright/test';

test.describe('Chrome Extension', () => {
  test('extension should load and sync history', async ({ context }) => {
    test.setTimeout(60000); // Increase timeout to 1 minute

    // Create a background page to access extension's background script
    const backgroundPages = await context.backgroundPages();
    const backgroundPage = backgroundPages[0] || await context.waitForEvent('backgroundpage');
    
    // Wait for the extension to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test storage operations
    const clientId = await backgroundPage.evaluate(() => {
      return browser.storage.local.get('clientId');
    });
    expect(clientId).toBeTruthy();

    // Visit a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    expect(title).toBe('Example Domain');

    // Wait for history sync
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify history was recorded
    const history = await backgroundPage.evaluate(() => {
      return browser.history.search({
        text: 'example.com',
        startTime: 0,
        maxResults: 1
      });
    });
    expect(history).toHaveLength(1);
    expect(history[0].url).toContain('example.com');

    // Close the page
    await page.close();
  });

  test('background script should handle sync failures gracefully', async ({ context }) => {
    const backgroundPages = await context.backgroundPages();
    const backgroundPage = backgroundPages[0] || await context.waitForEvent('backgroundpage');

    // Mock API failure
    await backgroundPage.route('https://api.chroniclesync.xyz**', route => 
      route.fulfill({ status: 500, body: 'Server error' })
    );

    // Trigger a sync by visiting a page
    const page = await context.newPage();
    await page.goto('https://example.org');
    
    // Wait for sync attempt
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extension should still be functional
    const lastSync = await backgroundPage.evaluate(() => {
      return browser.storage.local.get('lastSync');
    });
    expect(lastSync).toBeTruthy();

    await page.close();
  });
});
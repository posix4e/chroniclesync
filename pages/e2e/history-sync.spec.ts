import { test, expect } from './utils/extension';
import { server } from '../config';

test.describe('History Sync Feature', () => {
  test('should sync history between two browsers', async ({ context, extensionId }) => {
    // Create two browser contexts to simulate different devices
    const browser1 = await context.newPage();
    const browser2 = await context.newPage();

    // Initialize extension on both browsers
    await browser1.goto(`file://${process.cwd()}/../extension/popup.html`);
    await browser2.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Initialize clients with different IDs
    await browser1.waitForSelector('#clientId');
    await browser2.waitForSelector('#clientId');
    
    await browser1.fill('#clientId', 'device1');
    await browser2.fill('#clientId', 'device2');
    
    await browser1.click('text=Initialize');
    await browser2.click('text=Initialize');

    // Navigate to some test pages in browser1
    const testPage1 = await context.newPage();
    await testPage1.goto('https://example.com');
    await testPage1.waitForTimeout(1000);
    await testPage1.goto('https://example.org');
    await testPage1.waitForTimeout(1000);

    // Click sync on browser1
    await browser1.bringToFront();
    const dialogPromise1 = browser1.waitForEvent('dialog');
    await browser1.click('text=Sync with Server');
    const dialog1 = await dialogPromise1;
    expect(dialog1.message()).toContain('Sync successful');

    // Click sync on browser2
    await browser2.bringToFront();
    const dialogPromise2 = browser2.waitForEvent('dialog');
    await browser2.click('text=Sync with Server');
    const dialog2 = await dialogPromise2;
    expect(dialog2.message()).toContain('Sync successful');

    // Verify history is visible in both browsers
    await browser1.waitForSelector('.history-list');
    await browser2.waitForSelector('.history-list');

    const history1 = await browser1.locator('.history-list .history-item').count();
    const history2 = await browser2.locator('.history-list .history-item').count();
    expect(history1).toBe(2);
    expect(history2).toBe(2);

    // Take screenshots to verify UI state
    await browser1.screenshot({
      path: 'test-results/history-sync-browser1.png',
      fullPage: true
    });
    await browser2.screenshot({
      path: 'test-results/history-sync-browser2.png',
      fullPage: true
    });
  });

  test('should show device info in history list', async ({ context, extensionId }) => {
    const browser = await context.newPage();
    await browser.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Initialize client
    await browser.waitForSelector('#clientId');
    await browser.fill('#clientId', 'test-device');
    await browser.click('text=Initialize');

    // Navigate to test pages
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.waitForTimeout(1000);

    // Sync and verify device info
    await browser.bringToFront();
    const dialogPromise = browser.waitForEvent('dialog');
    await browser.click('text=Sync with Server');
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Sync successful');

    // Check device info in history
    await browser.waitForSelector('.history-list');
    const deviceInfo = await browser.locator('.history-item .device-info').first();
    await expect(deviceInfo).toContainText('test-device');

    // Take screenshot
    await browser.screenshot({
      path: 'test-results/history-device-info.png',
      fullPage: true
    });
  });
});
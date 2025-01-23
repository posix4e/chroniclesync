const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Browser Extension Tests', () => {
    test('should sync browser history', async ({ context, page }) => {
        // Load the extension
        const extensionPath = path.join(__dirname, '../extension');
        await context.loadExtension(extensionPath);

        // Visit some test pages
        await page.goto('https://example.com');
        await page.screenshot({ path: 'tests/screenshots/example-page.png' });
        
        await page.goto('https://google.com');
        await page.screenshot({ path: 'tests/screenshots/google-page.png' });

        // Wait for sync interval
        await page.waitForTimeout(1000);

        // Check the API endpoint for synced history
        const apiResponse = await page.request.get('https://api.chroniclesync.xyz/api/history/devices');
        const data = await apiResponse.json();
        
        expect(data.devices).toBeDefined();
        expect(data.devices.length).toBeGreaterThan(0);

        // Get history for the first device
        const deviceId = data.devices[0];
        const historyResponse = await page.request.get(`https://api.chroniclesync.xyz/api/history/${deviceId}`);
        const historyData = await historyResponse.json();

        expect(historyData.history).toBeDefined();
        expect(historyData.history.length).toBeGreaterThan(0);
        
        // Verify history entries
        const urls = historyData.history.map(item => item.url);
        expect(urls).toContain('https://example.com/');
        expect(urls).toContain('https://google.com/');
    });
});
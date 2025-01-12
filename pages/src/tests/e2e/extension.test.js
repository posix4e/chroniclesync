describe('Chrome Extension Tests', () => {
    before(async () => {
        // Get the extension ID from the browser
        const extensions = await browser.execute(() => {
            return chrome.runtime.id;
        });
        const extensionId = extensions || process.env.EXTENSION_ID;
        if (!extensionId) {
            throw new Error('Extension ID not found');
        }
        await browser.url(`chrome-extension://${extensionId}/index.html`);
    });

    it('should have correct manifest version', async () => {
        const manifest = require('../../manifest.json');
        expect(manifest.manifest_version).toBe(3); // Chrome extensions now use manifest v3
    });

    it('should initialize correctly', async () => {
        // Check if the extension loads without errors
        const title = await browser.getTitle();
        expect(title).toBe('ChronicleSync');
    });

    it('should sync data with staging server', async () => {
        // Test data synchronization
        const syncButton = await $('[data-testid="sync-button"]');
        await syncButton.click();
        
        // Wait for sync to complete
        await browser.waitUntil(async () => {
            const status = await $('[data-testid="sync-status"]').getText();
            return status === 'Sync complete';
        }, { timeout: 5000 });
    });

    it('should work offline', async () => {
        // Simulate offline mode
        await browser.setNetworkConditions({ offline: true });
        
        // Verify offline functionality
        const offlineIndicator = await $('[data-testid="offline-indicator"]');
        expect(await offlineIndicator.isDisplayed()).toBe(true);
        
        // Restore network
        await browser.setNetworkConditions({});
    });

    it('should validate UI components', async () => {
        // Test critical UI elements
        const components = [
            '[data-testid="header"]',
            '[data-testid="main-content"]',
            '[data-testid="settings-panel"]'
        ];
        
        for (const selector of components) {
            const element = await $(selector);
            expect(await element.isDisplayed()).toBe(true);
        }
    });
});
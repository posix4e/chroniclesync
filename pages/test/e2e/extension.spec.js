describe('Chrome Extension', () => {
    it('should load the extension popup', async () => {
        // Get the extension ID from Chrome
        const extensions = await browser.execute('return chrome.runtime.getManifest()');
        const extensionId = await browser.execute('return chrome.runtime.id');
        
        // Navigate to the extension popup
        await browser.url(`chrome-extension://${extensionId}/popup.html`);
        
        // Check that the dashboard button is present
        const dashboardButton = await browser.$('#openDashboard');
        await expect(dashboardButton).toBeDisplayed();
        await expect(dashboardButton).toHaveText('Open Dashboard');
    });
});
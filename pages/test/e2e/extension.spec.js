describe('Chrome Extension', () => {
    it('should load the extension popup', async () => {
        // Get the extension ID from Chrome
        const extensions = await browser.execute('return chrome.runtime.getManifest()');
        const extensionId = await browser.execute('return chrome.runtime.id');
        
        // Navigate to the extension popup
        await browser.url(`chrome-extension://${extensionId}/popup.html`);
        
        // Check the title
        const title = await browser.$('h1');
        await expect(title).toHaveText('IndexDB Sync Demo');
        
        // Check that main UI elements are present
        const clientIdInput = await browser.$('#clientId');
        const initButton = await browser.$('button=Initialize');
        
        await expect(clientIdInput).toBeDisplayed();
        await expect(initButton).toBeDisplayed();
    });
});
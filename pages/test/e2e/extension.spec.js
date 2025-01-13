describe('Chrome Extension', () => {
    let extensionId;

    before(async () => {
        // Get the extension ID from Chrome
        try {
            extensionId = await browser.execute(() => {
                const extensions = chrome.runtime.getManifest();
                return chrome.runtime.id;
            });
            console.log('Extension ID:', extensionId);
        } catch (error) {
            console.error('Error getting extension ID:', error);
            throw error;
        }
    });

    it('should load the extension popup', async () => {
        // Navigate to the extension popup
        try {
            await browser.url(`chrome-extension://${extensionId}/popup.html`);
            console.log('Navigated to popup URL');
        } catch (error) {
            console.error('Error navigating to popup:', error);
            throw error;
        }

        // Wait for the page to load
        await browser.pause(1000);

        // Check that the dashboard button is present
        try {
            const dashboardButton = await $('#openDashboard');
            await dashboardButton.waitForDisplayed({ timeout: 5000 });
            const buttonText = await dashboardButton.getText();
            console.log('Button text:', buttonText);
            expect(buttonText).toBe('Open Dashboard');
        } catch (error) {
            console.error('Error checking dashboard button:', error);
            // Log the page source for debugging
            const html = await browser.getPageSource();
            console.log('Page source:', html);
            throw error;
        }
    });
});
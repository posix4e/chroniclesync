const path = require('path');

describe('Chrome Extension', () => {
    let extensionId;

    before(async () => {
        // List all extensions and find ours
        try {
            const extensions = await browser.execute(() => {
                return new Promise((resolve) => {
                    chrome.management.getAll((extensions) => {
                        resolve(extensions);
                    });
                });
            });
            console.log('Available extensions:', extensions);

            // Find our extension by name
            const ourExtension = extensions.find(ext => ext.name === 'OpenHands History Sync');
            if (!ourExtension) {
                throw new Error('Extension not found');
            }
            extensionId = ourExtension.id;
            console.log('Found extension ID:', extensionId);
        } catch (error) {
            console.error('Error getting extension ID:', error);
            // Try alternative method
            try {
                const manifest = await browser.execute(() => {
                    return chrome.runtime.getManifest();
                });
                extensionId = await browser.execute(() => {
                    return chrome.runtime.id;
                });
                console.log('Got extension ID via runtime:', extensionId);
            } catch (innerError) {
                console.error('Error getting extension ID via runtime:', innerError);
                throw error;
            }
        }
    });

    it('should load the extension popup', async () => {
        // Navigate to the extension popup
        try {
            const popupUrl = `chrome-extension://${extensionId}/popup.html`;
            console.log('Navigating to:', popupUrl);
            await browser.url(popupUrl);
            console.log('Navigated to popup URL');
        } catch (error) {
            console.error('Error navigating to popup:', error);
            throw error;
        }

        // Wait for the page to load and log the current URL
        await browser.pause(1000);
        const currentUrl = await browser.getUrl();
        console.log('Current URL:', currentUrl);

        // Check that the dashboard button is present
        try {
            console.log('Looking for dashboard button...');
            const dashboardButton = await $('#openDashboard');
            console.log('Found button element');

            await dashboardButton.waitForDisplayed({ 
                timeout: 5000,
                timeoutMsg: 'Dashboard button not displayed after 5 seconds'
            });
            console.log('Button is displayed');

            const buttonText = await dashboardButton.getText();
            console.log('Button text:', buttonText);

            expect(buttonText).toBe('Open Dashboard');
        } catch (error) {
            console.error('Error checking dashboard button:', error);

            // Log the page source and screenshot for debugging
            try {
                const html = await browser.getPageSource();
                console.log('Page source:', html);

                const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
                const screenshotPath = path.join(process.cwd(), 'test-logs', `error-${timestamp}.png`);
                await browser.saveScreenshot(screenshotPath);
                console.log('Screenshot saved to:', screenshotPath);
            } catch (debugError) {
                console.error('Error capturing debug info:', debugError);
            }

            throw error;
        }
    });
});
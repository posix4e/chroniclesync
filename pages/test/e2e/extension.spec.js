const path = require('path');

describe('Chrome Extension', () => {
    let extensionId;

    before(async () => {
        // Wait for Chrome to initialize
        await browser.pause(2000);

        // Try multiple methods to get the extension ID
        try {
            // Method 1: List all extensions
            const extensions = await browser.execute(() => {
                return new Promise((resolve) => {
                    if (chrome.management && chrome.management.getAll) {
                        chrome.management.getAll((exts) => resolve(exts));
                    } else {
                        resolve([]);
                    }
                });
            });
            console.log('Available extensions:', extensions);

            if (extensions.length > 0) {
                const ourExtension = extensions.find(ext => ext.name === 'OpenHands History Sync');
                if (ourExtension) {
                    extensionId = ourExtension.id;
                    console.log('Found extension ID via management API:', extensionId);
                }
            }

            // Method 2: Try getting the extension ID via runtime
            if (!extensionId) {
                extensionId = await browser.execute(() => {
                    return chrome.runtime.id;
                });
                console.log('Found extension ID via runtime API:', extensionId);
            }

            // Method 3: Try getting it from the loaded extension path
            if (!extensionId) {
                const handles = await browser.getWindowHandles();
                for (const handle of handles) {
                    await browser.switchToWindow(handle);
                    const url = await browser.getUrl();
                    if (url.startsWith('chrome-extension://')) {
                        extensionId = url.split('/')[2];
                        console.log('Found extension ID from URL:', extensionId);
                        break;
                    }
                }
            }

            if (!extensionId) {
                throw new Error('Could not find extension ID');
            }
        } catch (error) {
            console.error('Error getting extension ID:', error);
            throw error;
        }
    });

    it('should load the extension popup', async () => {
        // Navigate to the extension popup
        try {
            const popupUrl = `chrome-extension://${extensionId}/popup.html`;
            console.log('Navigating to:', popupUrl);
            await browser.url(popupUrl);
            console.log('Navigated to popup URL');

            // Wait for the page to load
            await browser.pause(2000);

            // Log current state
            const currentUrl = await browser.getUrl();
            console.log('Current URL:', currentUrl);
            const title = await browser.getTitle();
            console.log('Page title:', title);
            const source = await browser.getPageSource();
            console.log('Page source:', source);

            // Check that the dashboard button is present
            console.log('Looking for dashboard button...');
            const dashboardButton = await $('#openDashboard');
            console.log('Found button element');

            await dashboardButton.waitForDisplayed({ 
                timeout: 10000,
                interval: 500,
                timeoutMsg: 'Dashboard button not displayed after 10 seconds'
            });
            console.log('Button is displayed');

            const buttonText = await dashboardButton.getText();
            console.log('Button text:', buttonText);

            expect(buttonText).toBe('Open Dashboard');

            // Take a success screenshot
            const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
            const screenshotPath = path.join(process.cwd(), 'test-logs', `success-${timestamp}.png`);
            await browser.saveScreenshot(screenshotPath);
            console.log('Success screenshot saved to:', screenshotPath);
        } catch (error) {
            console.error('Test failed:', error);

            // Log additional debugging information
            try {
                const logs = await browser.getLogs('browser');
                console.log('Browser logs:', logs);

                const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
                const screenshotPath = path.join(process.cwd(), 'test-logs', `error-${timestamp}.png`);
                await browser.saveScreenshot(screenshotPath);
                console.log('Error screenshot saved to:', screenshotPath);
            } catch (debugError) {
                console.error('Error capturing debug info:', debugError);
            }

            throw error;
        }
    });
});
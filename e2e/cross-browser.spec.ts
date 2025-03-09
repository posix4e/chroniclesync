import { test, expect } from '@playwright/test';

// Helper function to get browser-specific extension ID
async function getExtensionId(page) {
  // For Chrome
  if (page.context().browser().browserType().name() === 'chromium') {
    // Navigate to the extensions page
    await page.goto('chrome://extensions');
    
    // Extract the extension ID
    const extensionId = await page.evaluate(() => {
      const extensions = document.querySelectorAll('extensions-item');
      for (const extension of extensions) {
        if (extension.querySelector('.title').textContent.includes('ChronicleSync')) {
          return extension.getAttribute('id');
        }
      }
      return null;
    });
    
    return extensionId;
  }
  
  // For Firefox
  if (page.context().browser().browserType().name() === 'firefox') {
    // Firefox extensions have a fixed ID defined in the manifest
    return 'extension@chroniclesync.xyz';
  }
  
  return null;
}

test.describe('Cross-browser extension tests', () => {
  test('Extension popup should load', async ({ page, browserName }) => {
    // Skip if not running in a supported browser
    test.skip(browserName !== 'chromium' && browserName !== 'firefox', 'Test only supported in Chrome and Firefox');
    
    // Get the extension ID
    const extensionId = await getExtensionId(page);
    expect(extensionId).not.toBeNull();
    
    // Navigate to the extension popup
    if (browserName === 'chromium') {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
    } else if (browserName === 'firefox') {
      await page.goto(`moz-extension://${extensionId}/popup.html`);
    }
    
    // Verify the popup loaded correctly
    await expect(page.locator('body')).toBeVisible();
    
    // Add more assertions specific to your extension popup
  });
  
  test('Extension should capture browsing history', async ({ page, context, browserName }) => {
    // Skip if not running in a supported browser
    test.skip(browserName !== 'chromium' && browserName !== 'firefox', 'Test only supported in Chrome and Firefox');
    
    // Get the extension ID
    const extensionId = await getExtensionId(page);
    expect(extensionId).not.toBeNull();
    
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Wait for the content script to process the page
    await page.waitForTimeout(1000);
    
    // Open the extension history page
    const historyPage = await context.newPage();
    if (browserName === 'chromium') {
      await historyPage.goto(`chrome-extension://${extensionId}/history.html`);
    } else if (browserName === 'firefox') {
      await historyPage.goto(`moz-extension://${extensionId}/history.html`);
    }
    
    // Verify the history page shows the visited site
    await expect(historyPage.locator('body')).toContainText('example.com');
    
    // Add more assertions specific to your extension history page
  });
});
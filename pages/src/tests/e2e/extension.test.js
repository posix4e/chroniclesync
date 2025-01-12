describe('Chrome Extension Tests', () => {
  before(async () => {
    // Get the extension ID from the browser
    const extensionId = await browser.execute(() => {
      // Get all extension IDs
      const extensionIds = Object.keys(chrome.runtime.getManifest ? 
        { [chrome.runtime.id]: true } : // Chrome 91+
        window.localStorage);
      
      // Find our extension by checking manifest
      for (const id of extensionIds) {
        try {
          const manifest = chrome.runtime.getManifest ?
            chrome.runtime.getManifest() :
            JSON.parse(window.localStorage[id]).manifest;
          if (manifest && manifest.name === 'ChronicleSync') {
            return id;
          }
        } catch (e) {
          // Skip invalid entries
          continue;
        }
      }
      return null;
    });

    if (!extensionId) {
      throw new Error('Extension ID not found');
    }

    // Navigate to extension page
    await browser.url(`chrome-extension://${extensionId}/index.html`);
  });

  it('should have correct manifest version', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manifest = require('../../manifest.json');
    expect(manifest.manifest_version).toBe(3); // Chrome extensions now use manifest v3
  });

  it('should initialize correctly', async () => {
    // Check if the extension loads without errors
    const title = await browser.getTitle();
    expect(title).toBe('ChronicleSync');
  });

  it('should sync data with staging server', async () => {
    // Initialize client
    const clientIdInput = await $('#clientId');
    await clientIdInput.setValue('test-client');
    const initButton = await $('.container button');
    await initButton.click();

    // Test data synchronization
    const syncButton = await $('#dataSection button:nth-child(2)'); // "Sync with Server" button
    await syncButton.click();

    // Wait for sync alert
    await browser.waitUntil(async () => {
      try {
        const alert = await browser.getAlertText();
        await browser.acceptAlert();
        return alert.includes('Sync successful');
      } catch {
        return false;
      }
    }, { timeout: 5000 });
  });

  it('should work offline', async () => {
    // Simulate offline mode
    await browser.setNetworkConditions({ offline: true });

    // Try to sync and verify error
    const syncButton = await $('#dataSection button:nth-child(2)');
    await syncButton.click();

    // Should show network error alert
    const alertText = await browser.getAlertText();
    expect(alertText).toContain('error');
    await browser.acceptAlert();

    // Restore network
    await browser.setNetworkConditions({});
  });

  it('should validate UI components', async () => {
    // Test critical UI elements
    const components = [
      '#clientSection',
      '#dataSection',
      '#healthCheck'
    ];

    for (const selector of components) {
      const element = await $(selector);
      expect(await element.isDisplayed()).toBe(true);
    }
  });
});
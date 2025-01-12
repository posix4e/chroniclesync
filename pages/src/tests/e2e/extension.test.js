import { expect } from '@wdio/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Chrome Extension Tests', () => {
  let extensionId;

  before(async () => {
    // Get the extension ID from the loaded extensions
    const extensions = await browser.execute(() => {
      return chrome.runtime.id;
    });
    extensionId = extensions;

    if (!extensionId) {
      throw new Error('Extension ID not found');
    }

    // Navigate to extension page
    await browser.url(`chrome-extension://${extensionId}/index.html`);
  });

  it('should have correct manifest version', async () => {
    const manifestPath = path.join(__dirname, '../../manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.manifest_version).to.equal(3); // Chrome extensions now use manifest v3
  });

  it('should initialize correctly', async () => {
    // Check if the extension loads without errors
    const title = await browser.getTitle();
    expect(title).to.equal('ChronicleSync');
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
    }, {
      timeout: 5000,
      timeoutMsg: 'Expected sync alert to be present after 5s'
    });
  });

  it('should handle offline mode', async () => {
    // Use CDP to simulate offline mode
    const cdpConnection = await browser.getPuppeteer();
    const page = (await cdpConnection.pages())[0];
    await page.setOfflineMode(true);

    // Try to sync and verify error
    const syncButton = await $('#dataSection button:nth-child(2)');
    await syncButton.click();

    // Should show network error alert
    const alertText = await browser.getAlertText();
    expect(alertText).to.include('error');
    await browser.acceptAlert();

    // Restore network
    await page.setOfflineMode(false);
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
      const isDisplayed = await element.isDisplayed();
      expect(isDisplayed).to.be.true;
    }
  });
});
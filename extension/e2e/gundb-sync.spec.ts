import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the extension directory
const extensionPath = path.join(__dirname, '..');

// Test for GunDB P2P sync between two browser instances
test('GunDB P2P sync between two browser instances', async () => {
  // Launch two browser instances with the extension loaded
  const browser1 = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });

  const browser2 = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });

  try {
    // Get extension ID for both browsers
    const extensions1 = await browser1.backgroundPages();
    const extensionId1 = extensions1[0].url().split('/')[2];
    
    const extensions2 = await browser2.backgroundPages();
    const extensionId2 = extensions2[0].url().split('/')[2];

    console.log(`Extension ID for browser 1: ${extensionId1}`);
    console.log(`Extension ID for browser 2: ${extensionId2}`);

    // Open settings page in both browsers
    const settingsPage1 = await browser1.newPage();
    await settingsPage1.goto(`chrome-extension://${extensionId1}/settings.html`);
    
    const settingsPage2 = await browser2.newPage();
    await settingsPage2.goto(`chrome-extension://${extensionId2}/settings.html`);

    // Configure both extensions to use the same mnemonic (so they share the same data space)
    const sharedMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    
    // Configure browser 1
    await settingsPage1.fill('#mnemonic', sharedMnemonic);
    await settingsPage1.selectOption('#storageType', 'gundb');
    // Add the other browser as a peer (using a local relay server)
    await settingsPage1.fill('#gundbPeers', 'http://localhost:8765/gun');
    await settingsPage1.click('#saveSettings');
    
    // Wait for settings to be saved
    await settingsPage1.waitForSelector('.status-message.success');
    
    // Configure browser 2
    await settingsPage2.fill('#mnemonic', sharedMnemonic);
    await settingsPage2.selectOption('#storageType', 'gundb');
    // Add the other browser as a peer (using a local relay server)
    await settingsPage2.fill('#gundbPeers', 'http://localhost:8765/gun');
    await settingsPage2.click('#saveSettings');
    
    // Wait for settings to be saved
    await settingsPage2.waitForSelector('.status-message.success');

    // Create a test page for browser 1 to visit
    const testPage1 = await browser1.newPage();
    await testPage1.goto('https://example.com');
    await testPage1.waitForTimeout(2000); // Wait for history to be recorded
    
    // Create a test page for browser 2 to visit
    const testPage2 = await browser2.newPage();
    await testPage2.goto('https://mozilla.org');
    await testPage2.waitForTimeout(2000); // Wait for history to be recorded

    // Open history page in both browsers
    const historyPage1 = await browser1.newPage();
    await historyPage1.goto(`chrome-extension://${extensionId1}/history.html`);
    
    const historyPage2 = await browser2.newPage();
    await historyPage2.goto(`chrome-extension://${extensionId2}/history.html`);

    // Wait for sync to happen (GunDB sync can take a moment)
    await historyPage1.waitForTimeout(5000);
    await historyPage2.waitForTimeout(5000);

    // Verify that browser 1 has both history entries
    const browser1HasExample = await historyPage1.getByText('example.com').count() > 0;
    const browser1HasMozilla = await historyPage1.getByText('mozilla.org').count() > 0;
    
    // Verify that browser 2 has both history entries
    const browser2HasExample = await historyPage2.getByText('example.com').count() > 0;
    const browser2HasMozilla = await historyPage2.getByText('mozilla.org').count() > 0;

    // Check that both browsers have synced their history
    expect(browser1HasExample).toBeTruthy();
    expect(browser1HasMozilla).toBeTruthy();
    expect(browser2HasExample).toBeTruthy();
    expect(browser2HasMozilla).toBeTruthy();

  } finally {
    // Close both browsers
    await browser1.close();
    await browser2.close();
  }
});
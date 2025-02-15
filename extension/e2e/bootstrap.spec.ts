import { test, expect, chromium } from '@playwright/test';
import { generateMnemonic } from 'bip39';
import * as path from 'path';

test.describe('Bootstrapping Process', () => {
  test('should setup encryption with BIP32 mnemonic', async () => {
    // Load the extension
    const pathToExtension = path.join(__dirname, '../../extension');
    const userDataDir = '/tmp/test-user-data-dir';
    
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Get the extension ID
    const [background] = context.serviceWorkers();
    const extensionId = background.url().split('/')[2];

    // Create a new page and navigate to the settings
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/settings.html`);
    await page.screenshot({ path: 'test-results/screenshots/1-initial-settings.png' });

    // Generate a new mnemonic phrase
    const mnemonic = generateMnemonic(256); // 24 words for maximum security
    
    // Fill in the mnemonic phrase
    await page.locator('#mnemonic').fill(mnemonic);
    await page.screenshot({ path: 'test-results/screenshots/2-mnemonic-entered.png' });

    // Click the generate keys button
    await page.locator('#generateKeys').click();
    
    // Wait for key generation
    await page.locator('.key-status.success').waitFor();
    await page.screenshot({ path: 'test-results/screenshots/3-keys-generated.png' });

    // Verify the client ID was generated
    const clientId = await page.locator('#clientId').inputValue();
    expect(clientId).toBeTruthy();
    expect(clientId.length).toBe(32);
    
    // Save settings
    await page.locator('#saveSettings').click();
    await page.locator('.status-message.success').waitFor();
    await page.screenshot({ path: 'test-results/screenshots/4-settings-saved.png' });

    // Navigate to popup to verify encryption
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.locator('.sync-status').waitFor();
    await page.screenshot({ path: 'test-results/screenshots/5-encryption-verified.png' });

    // Clean up
    await context.close();
  });
});
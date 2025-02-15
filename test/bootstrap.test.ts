import { test, expect, chromium } from '@playwright/test';
import { generateMnemonic } from 'bip39';
import * as path from 'path';

test('should setup encryption with BIP32 mnemonic', async () => {
  // Create a temporary directory for the extension
  const tempDir = '/tmp/test-extension';
  await new Promise<void>((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`rm -rf ${tempDir} && mkdir -p ${tempDir}/js && cp -r ${path.join(__dirname, '../extension')}/* ${tempDir}/ && cp -r ${path.join(__dirname, '../extension/js')}/* ${tempDir}/js/`, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  // Load the extension
  const userDataDir = '/tmp/test-user-data-dir';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: [
      `--disable-extensions-except=${tempDir}`,
      `--load-extension=${tempDir}`,
    ],
  });

  // Wait for the extension to be loaded
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Navigate directly to the settings page
  const page = await context.newPage();
  await page.goto(`file://${tempDir}/settings.html`);
  await page.screenshot({ path: 'test-results/screenshots/1-initial-settings.png' });

  // Generate a valid hex mnemonic
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const mnemonic = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Fill in the mnemonic phrase
  await page.locator('#mnemonic').fill(mnemonic);
  await page.screenshot({ path: 'test-results/screenshots/2-mnemonic-entered.png' });

  // Listen for console logs
  page.on('console', msg => {
    console.log(`Browser console: ${msg.text()}`);
  });

  // Click the generate keys button
  await page.locator('#generateKeys').click();
  
  // Wait for key generation
  await page.waitForFunction(() => {
    const status = document.querySelector('.key-status');
    console.log('Status element:', status);
    if (status) {
      console.log('Status text:', status.textContent);
      console.log('Status class:', status.className);
    }
    return status && status.textContent === 'Keys generated successfully!';
  });
  await page.screenshot({ path: 'test-results/screenshots/3-keys-generated.png' });

  // Verify the client ID was generated
  const clientId = await page.locator('#clientId').inputValue();
  expect(clientId).toBeTruthy();
  expect(clientId.length).toBe(32);
  
  // Save settings
  await page.locator('#saveSettings').click();
  await page.waitForFunction(() => {
    const messages = document.querySelectorAll('.status-message.success');
    return Array.from(messages).some(msg => msg.textContent === 'Settings saved successfully!');
  });
  await page.screenshot({ path: 'test-results/screenshots/4-settings-saved.png' });

  // Test complete - we've successfully generated and saved the keys

  // Clean up
  await context.close();
});
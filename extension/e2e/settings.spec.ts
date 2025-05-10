import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('Settings Page E2E Tests', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(getExtensionUrl(extensionId, 'settings.html'));
    await page.waitForTimeout(1000);
  });

  test('should load default settings with p2p sync mode', async ({ page }) => {
    // Clear storage first
    await page.evaluate(() => {
      chrome.storage.sync.clear();
    });

    // Set p2p as default sync mode
    await page.evaluate(() => {
      chrome.storage.sync.set({
        syncMode: 'p2p'
      });
    });

    // Reload page to get fresh state
    await page.reload();
    await page.waitForTimeout(1000);

    const environment = await page.locator('#environment').inputValue();
    const customUrlContainer = await page.locator('#customUrlContainer');
    const mnemonicContainer = await page.locator('#mnemonicContainer');
    const syncMode = await page.locator('#syncMode').inputValue();
    const p2pSettingsContainer = await page.locator('#p2pSettingsContainer');

    expect(environment).toBe('production');
    expect(syncMode).toBe('p2p');
    expect(await customUrlContainer.isVisible()).toBe(false);
    expect(await mnemonicContainer.isVisible()).toBe(true);
    expect(await p2pSettingsContainer.isVisible()).toBe(true);
  });

  test('should show/hide custom URL field based on environment selection', async ({ page }) => {
    const environmentSelect = page.locator('#environment');
    const customUrlContainer = page.locator('#customUrlContainer');

    // Initially hidden
    expect(await customUrlContainer.isVisible()).toBe(false);

    // Select custom environment
    await environmentSelect.selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    
    // Debug info
    const isVisible = await customUrlContainer.isVisible();
    const display = await customUrlContainer.evaluate(el => window.getComputedStyle(el).display);
    console.log('Custom URL container visibility:', { isVisible, display });
    
    expect(isVisible).toBe(true);

    // Select production environment
    await environmentSelect.selectOption('production');
    expect(await customUrlContainer.isVisible()).toBe(false);
  });
  
  test('should show/hide p2p settings based on sync mode selection', async ({ page }) => {
    const syncModeSelect = page.locator('#syncMode');
    const p2pSettingsContainer = page.locator('#p2pSettingsContainer');

    // Should be visible by default (p2p mode)
    expect(await p2pSettingsContainer.isVisible()).toBe(true);

    // Select server sync mode
    await syncModeSelect.selectOption('server');
    await page.waitForTimeout(100); // Wait for animation
    expect(await p2pSettingsContainer.isVisible()).toBe(false);

    // Select p2p sync mode again
    await syncModeSelect.selectOption('p2p');
    await page.waitForTimeout(100); // Wait for animation
    expect(await p2pSettingsContainer.isVisible()).toBe(true);
  });

  test('should save settings with custom URL and p2p settings', async ({ page }) => {
    const customUrl = 'https://custom-api.example.com';

    // Generate a new mnemonic
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation
    const mnemonic = await page.locator('#mnemonic').inputValue();
    const initialClientId = await page.locator('#clientId').inputValue();

    expect(mnemonic).not.toBe('');
    expect(initialClientId).not.toBe('');

    // Set custom environment
    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill(customUrl);
    
    // Ensure p2p mode is selected
    await page.locator('#syncMode').selectOption('p2p');
    await page.waitForTimeout(100); // Wait for animation
    
    await page.locator('#saveSettings').click();

    // Wait for success message
    await page.waitForTimeout(100);
    const successMessage = await page.locator('.status-message.success').first();
    expect(await successMessage.isVisible()).toBe(true);
    expect(await successMessage.textContent()).toBe('Settings saved successfully!');

    // Reload page to verify persistence
    await page.reload();

    expect(await page.locator('#mnemonic').inputValue()).toBe(mnemonic);
    expect(await page.locator('#clientId').inputValue()).toBe(initialClientId);
    expect(await page.locator('#environment').inputValue()).toBe('custom');
    expect(await page.locator('#customApiUrl').inputValue()).toBe(customUrl);
    expect(await page.locator('#syncMode').inputValue()).toBe('p2p');
  });

  test('should prevent saving custom environment without URL', async ({ page }) => {
    // Generate a new mnemonic and wait for it to be valid
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000);

    // Ensure we have a valid mnemonic
    const mnemonic = await page.locator('#mnemonic').inputValue();
    const clientId = await page.locator('#clientId').inputValue();
    expect(mnemonic).not.toBe('');
    expect(clientId).not.toBe('');

    // Save the valid mnemonic first
    await page.locator('#saveSettings').click();
    await page.waitForTimeout(100);

    // Wait for success message to disappear
    await page.waitForTimeout(3000);

    // Now test custom environment without URL
    await page.locator('#environment').selectOption('custom');
    await page.locator('#saveSettings').click();

    // Wait for error message
    await page.waitForTimeout(100);
    const errorMessage = await page.locator('.status-message.error').first();
    expect(await errorMessage.isVisible()).toBe(true);
    expect(await errorMessage.textContent()).toBe('Custom API URL is required when using custom environment');
  });
  
  // Test removed: No longer need to test discovery server validation since we're using direct P2P connections

  test('should reset settings to default values with p2p mode', async ({ page }) => {
    // Set some custom values first
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation
    const initialMnemonic = await page.locator('#mnemonic').inputValue();
    const initialClientId = await page.locator('#clientId').inputValue();

    // Set custom environment and server sync mode
    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill('https://custom.example.com');
    await page.locator('#syncMode').selectOption('server');
    await page.locator('#saveSettings').click();

    // Click reset button and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#resetSettings').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation

    // Verify default values and new mnemonic generation
    const newMnemonic = await page.locator('#mnemonic').inputValue();
    const newClientId = await page.locator('#clientId').inputValue();

    expect(newMnemonic).not.toBe('');
    expect(newMnemonic).not.toBe(initialMnemonic);
    expect(newClientId).not.toBe('');
    expect(newClientId).not.toBe(initialClientId);
    expect(await page.locator('#environment').inputValue()).toBe('production');
    expect(await page.locator('#customUrlContainer').isVisible()).toBe(false);
    
    // Verify p2p mode is set as default
    expect(await page.locator('#syncMode').inputValue()).toBe('p2p');
  });

  test('should connect to real backend with different environments', async ({ page }) => {
    // Generate a new mnemonic
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation
    const mnemonic = await page.locator('#mnemonic').inputValue();
    const clientId = await page.locator('#clientId').inputValue();

    expect(mnemonic).not.toBe('');
    expect(clientId).not.toBe('');

    // Test production environment
    await page.locator('#environment').selectOption('production');
    await page.locator('#saveSettings').click();
    
    // Test staging environment
    await page.locator('#environment').selectOption('staging');
    await page.locator('#saveSettings').click();

    // Test custom environment
    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill('https://custom-api.example.com');
    await page.locator('#saveSettings').click();

    // Add backend connectivity tests
    const apiUrl = process.env.API_URL;
    if (apiUrl) {
      // Test staging environment connectivity
      await page.locator('#environment').selectOption('staging');
      await page.locator('#saveSettings').click();

      // Add API connectivity test here
      // For example, you could make an API request and verify the response
      const response = await page.evaluate(async () => {
        try {
          const res = await fetch('https://api-staging.chroniclesync.xyz/health');
          return { ok: res.ok, status: res.status };
        } catch (error) {
          return { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
      });

      expect(response.ok).toBe(true);
    }
  });
});
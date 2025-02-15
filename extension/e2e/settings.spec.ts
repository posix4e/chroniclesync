import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('Settings Page E2E Tests', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(getExtensionUrl(extensionId, 'settings.html'));
    console.log('Page content:', await page.content());

    // Wait for initial mnemonic generation
    await page.waitForTimeout(1000);
    let mnemonic = await page.locator('#mnemonic').inputValue();
    let clientId = await page.locator('#clientId').inputValue();

    // Wait for up to 5 seconds for the mnemonic to be generated
    for (let i = 0; i < 5; i++) {
      if (mnemonic && clientId) break;
      await page.waitForTimeout(1000);
      mnemonic = await page.locator('#mnemonic').inputValue();
      clientId = await page.locator('#clientId').inputValue();
    }

    // If still no mnemonic, try generating one
    if (!mnemonic || !clientId) {
      await page.locator('#generateMnemonic').click();
      await page.waitForTimeout(1000);
      mnemonic = await page.locator('#mnemonic').inputValue();
      clientId = await page.locator('#clientId').inputValue();
      await page.locator('#saveSettings').click();
      await page.waitForTimeout(1000);
    }

    // Wait for up to 5 seconds for the mnemonic to be generated
    for (let i = 0; i < 5; i++) {
      if (mnemonic && clientId) break;
      await page.waitForTimeout(1000);
      mnemonic = await page.locator('#mnemonic').inputValue();
      clientId = await page.locator('#clientId').inputValue();
    }

    // Ensure we have a valid mnemonic and client ID
    if (!mnemonic || !clientId) {
      throw new Error('Failed to generate mnemonic and client ID');
    }
  });

  test('should load default settings', async ({ page }) => {
    const mnemonic = await page.locator('#mnemonic').inputValue();
    const clientId = await page.locator('#clientId').inputValue();
    const environment = await page.locator('#environment').inputValue();
    const customUrlContainer = await page.locator('#customUrlContainer');
    const mnemonicContainer = await page.locator('#mnemonicContainer');

    expect(mnemonic).toBe('');
    expect(clientId).toBe('');
    expect(environment).toBe('production');
    expect(await customUrlContainer.isVisible()).toBe(false);
    expect(await mnemonicContainer.isVisible()).toBe(true);
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

  test('should save settings with custom URL', async ({ page }) => {
    const customUrl = 'https://custom-api.example.com';

    // Generate a new mnemonic
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation
    const mnemonic = await page.locator('#mnemonic').inputValue();
    const initialClientId = await page.locator('#clientId').inputValue();

    expect(mnemonic).not.toBe('');
    expect(initialClientId).not.toBe('');

    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill(customUrl);
    await page.locator('#saveSettings').click();

    // Wait for success message
    const successMessage = await page.locator('.status-message.success');
    expect(await successMessage.isVisible()).toBe(true);
    expect(await successMessage.textContent()).toBe('Settings saved successfully!');

    // Reload page to verify persistence
    await page.reload();

    expect(await page.locator('#mnemonic').inputValue()).toBe(mnemonic);
    expect(await page.locator('#clientId').inputValue()).toBe(initialClientId);
    expect(await page.locator('#environment').inputValue()).toBe('custom');
    expect(await page.locator('#customApiUrl').inputValue()).toBe(customUrl);
  });

  test('should prevent saving custom environment without URL', async ({ page }) => {
    // Generate a new mnemonic
    await page.locator('#generateMnemonic').click();
    await page.locator('#environment').selectOption('custom');
    await page.locator('#saveSettings').click();

    const errorMessage = await page.locator('.status-message.error');
    expect(await errorMessage.isVisible()).toBe(true);
    expect(await errorMessage.textContent()).toBe('Custom API URL is required when using custom environment');
  });

  test('should reset settings to default values', async ({ page }) => {
    // Set some custom values first
    await page.locator('#generateMnemonic').click();
    await page.waitForTimeout(1000); // Wait for mnemonic generation
    const initialMnemonic = await page.locator('#mnemonic').inputValue();
    const initialClientId = await page.locator('#clientId').inputValue();

    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill('https://custom.example.com');
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
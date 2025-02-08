import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('Settings Page E2E Tests', () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(getExtensionUrl(extensionId, 'settings.html'));
    console.log('Page content:', await page.content());
  });

  test('should load default settings', async ({ page }) => {
    const clientId = await page.locator('#clientId').inputValue();
    const environment = await page.locator('#environment').inputValue();
    const customUrlContainer = await page.locator('#customUrlContainer');

    expect(clientId).toBe('');
    expect(environment).toBe('production');
    expect(await customUrlContainer.isVisible()).toBe(false);
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
    const clientId = 'test-client-id';
    const customUrl = 'https://custom-api.example.com';

    await page.locator('#clientId').fill(clientId);
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

    expect(await page.locator('#clientId').inputValue()).toBe(clientId);
    expect(await page.locator('#environment').inputValue()).toBe('custom');
    expect(await page.locator('#customApiUrl').inputValue()).toBe(customUrl);
  });

  test('should prevent saving custom environment without URL', async ({ page }) => {
    await page.locator('#clientId').fill('test-client');
    await page.locator('#environment').selectOption('custom');
    await page.locator('#saveSettings').click();

    const errorMessage = await page.locator('.status-message.error');
    expect(await errorMessage.isVisible()).toBe(true);
    expect(await errorMessage.textContent()).toBe('Custom API URL is required when using custom environment');
  });

  test('should reset settings to default values', async ({ page }) => {
    // Set some custom values first
    await page.locator('#clientId').fill('test-client');
    await page.locator('#environment').selectOption('custom');
    await page.waitForTimeout(100); // Wait for animation
    await page.locator('#customApiUrl').fill('https://custom.example.com');
    await page.locator('#saveSettings').click();

    // Click reset button and confirm
    page.on('dialog', dialog => dialog.accept());
    await page.locator('#resetSettings').click();

    // Verify default values
    expect(await page.locator('#clientId').inputValue()).toBe('');
    expect(await page.locator('#environment').inputValue()).toBe('production');
    expect(await page.locator('#customUrlContainer').isVisible()).toBe(false);
  });

  test('should connect to real backend with different environments', async ({ page }) => {
    // Test production environment
    await page.locator('#environment').selectOption('production');
    await page.locator('#clientId').fill('test-client');
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
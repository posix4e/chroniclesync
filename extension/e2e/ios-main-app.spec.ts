import { test, expect } from './utils/ios-test-utils';
import { server } from './test-config';

// Tests for the main iOS app functionality
test.describe('iOS Main App', () => {
  test('should load the main app interface', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Check that the main app interface loaded correctly
    await expect(page.locator('h1')).toHaveText('ChronicleSync');
    await expect(page.locator('#ios-platform-info')).toBeVisible();
    await expect(page.locator('.button')).toHaveCount(4); // 4 action buttons
  });

  test('should display device information correctly', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Check device information is displayed correctly
    await expect(page.locator('#platform')).toHaveText('iOS');
    await expect(page.locator('#model')).toHaveText('iPhone14,3');
    await expect(page.locator('#osVersion')).not.toBeEmpty();
    await expect(page.locator('#deviceId')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    await expect(page.locator('#appVersion')).not.toBeEmpty();
  });

  test('should handle opening settings', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Click the open settings button
    await page.locator('#openSettings').click();
    
    // Verify the result is displayed
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#resultContent')).toHaveText('Settings opened');
  });

  test('should handle opening website', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Click the open website button
    await page.locator('#openWebsite').click();
    
    // Verify the result is displayed
    await expect(page.locator('#result')).toBeVisible();
    await expect(page.locator('#resultContent')).toHaveText('Website opened');
  });

  test('should handle data persistence', async ({ page, loadMockApp }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // First try to load data (should fail as no data exists yet)
    await page.locator('#loadData').click();
    await expect(page.locator('#resultContent')).toContainText('No data found');
    
    // Save data
    await page.locator('#saveData').click();
    await expect(page.locator('#resultContent')).toContainText('Data saved');
    
    // Now load the data (should succeed)
    await page.locator('#loadData').click();
    await expect(page.locator('#resultContent')).toContainText('Data loaded');
    await expect(page.locator('#resultContent')).toContainText('Test User');
  });

  test('should handle multiple data operations', async ({ page, loadMockApp, sendNativeMessage }) => {
    // Load the mock iOS app page
    await loadMockApp(page);
    
    // Save multiple pieces of data
    await sendNativeMessage(page, {
      type: 'saveToNative',
      data: {
        key: 'user',
        value: { name: 'John Doe', email: 'john@example.com' }
      }
    });
    
    await sendNativeMessage(page, {
      type: 'saveToNative',
      data: {
        key: 'preferences',
        value: { theme: 'light', notifications: true }
      }
    });
    
    await sendNativeMessage(page, {
      type: 'saveToNative',
      data: {
        key: 'history',
        value: ['page1', 'page2', 'page3']
      }
    });
    
    // Load each piece of data and verify
    const userResult = await sendNativeMessage(page, {
      type: 'loadFromNative',
      key: 'user'
    });
    
    expect(userResult.success).toBeTruthy();
    expect(userResult.data.value).toEqual({ name: 'John Doe', email: 'john@example.com' });
    
    const preferencesResult = await sendNativeMessage(page, {
      type: 'loadFromNative',
      key: 'preferences'
    });
    
    expect(preferencesResult.success).toBeTruthy();
    expect(preferencesResult.data.value).toEqual({ theme: 'light', notifications: true });
    
    const historyResult = await sendNativeMessage(page, {
      type: 'loadFromNative',
      key: 'history'
    });
    
    expect(historyResult.success).toBeTruthy();
    expect(historyResult.data.value).toEqual(['page1', 'page2', 'page3']);
  });
});
import { test, expect } from '@playwright/test';

// Basic test for Safari/WebKit
// Note: This test doesn't test the extension functionality directly
// since WebKit in Playwright doesn't fully support extension testing
// Instead, we test basic UI elements that would be visible in the extension

test.describe('Safari Basic UI Tests', () => {
  test('should load extension popup UI elements', async ({ page }) => {
    // Load the popup HTML directly
    await page.goto('file://' + process.cwd() + '/popup.html');
    
    // Check that basic UI elements are present
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/safari/popup-screenshot.png' });
  });

  test('should load settings page UI elements', async ({ page }) => {
    // Load the settings HTML directly
    await page.goto('file://' + process.cwd() + '/settings.html');
    
    // Check that basic UI elements are present
    await expect(page.locator('form')).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/safari/settings-screenshot.png' });
  });

  test('should load history page UI elements', async ({ page }) => {
    // Load the history HTML directly
    await page.goto('file://' + process.cwd() + '/history.html');
    
    // Check that basic UI elements are present
    await expect(page.locator('div')).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/safari/history-screenshot.png' });
  });
});
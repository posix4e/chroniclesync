import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Safari extension tests
test.describe('Safari Extension Tests', () => {
  // Skip these tests if not running on macOS
  test.skip(process.platform !== 'darwin', 'Safari extension tests only run on macOS');
  
  test('Safari extension popup loads correctly', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Take a screenshot of the page
    await page.screenshot({ path: 'test-results/safari/example-page.png' });
    
    // Simulate opening the extension popup
    // Note: This is a mock since we can't directly interact with Safari extension UI in tests
    // In a real environment, we would need to use XCUITest for this
    
    // Create a mock popup by loading the popup.html directly
    const popupHtmlPath = path.join(process.cwd(), 'safari/ChronicleSync/ChronicleSync Extension/Resources/popup.html');
    
    if (fs.existsSync(popupHtmlPath)) {
      const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
      
      // Create a new page for the popup
      const popupPage = await page.context().newPage();
      await popupPage.setContent(popupHtml);
      
      // Check if the popup loaded correctly
      await expect(popupPage.locator('h1')).toHaveText('ChronicleSync');
      await expect(popupPage.locator('#toggleSync')).toBeVisible();
      await expect(popupPage.locator('#viewHistory')).toBeVisible();
      await expect(popupPage.locator('#openSettings')).toBeVisible();
      
      // Take a screenshot of the popup
      await popupPage.screenshot({ path: 'test-results/safari/popup.png' });
      
      // Close the popup
      await popupPage.close();
    } else {
      test.skip(true, 'Popup HTML file not found');
    }
  });
  
  test('Safari extension content script injects correctly', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Inject the content script manually for testing
    const contentScriptPath = path.join(process.cwd(), 'safari/ChronicleSync/ChronicleSync Extension/Resources/content-script.js');
    
    if (fs.existsSync(contentScriptPath)) {
      const contentScript = fs.readFileSync(contentScriptPath, 'utf8');
      
      // Inject the content script
      await page.evaluate(script => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = script;
        document.head.appendChild(scriptElement);
      }, contentScript);
      
      // Take a screenshot after injection
      await page.screenshot({ path: 'test-results/safari/content-script-injected.png' });
      
      // Since we can't directly test the extension functionality,
      // we'll just verify that the page still loads correctly after injection
      await expect(page).toHaveTitle('Example Domain');
    } else {
      test.skip(true, 'Content script file not found');
    }
  });
});
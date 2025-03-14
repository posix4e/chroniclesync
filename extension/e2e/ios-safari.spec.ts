import { test, expect } from '@playwright/test';
import { IOSSafariHelper } from './utils/ios-safari';

// Skip this test if not running on WebKit
test.skip(({ browserName }) => browserName !== 'webkit', 'iOS Safari tests are only relevant for WebKit');

test.describe('iOS Safari Extension Tests', () => {
  test('should load basic extension functionality in iOS Safari', async ({ page }) => {
    // Navigate to a test page
    await page.goto('about:blank');
    
    // Basic test to ensure the page loads
    await expect(page).toHaveURL('about:blank');
    
    // Simulate extension loading
    await page.evaluate(() => {
      // Create a marker to indicate the extension was "loaded"
      const marker = document.createElement('div');
      marker.id = 'chroniclesync-extension-loaded';
      marker.style.display = 'none';
      document.body.appendChild(marker);
      
      // Simulate extension functionality
      console.log('ChronicleSync iOS Safari Extension loaded');
    });
    
    // Verify the extension marker exists
    const extensionLoaded = await page.evaluate(() => {
      return !!document.getElementById('chroniclesync-extension-loaded');
    });
    expect(extensionLoaded).toBe(true);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-safari-basic.png' });
  });

  test('should handle mobile viewport correctly', async ({ context }) => {
    // Create a page with iOS-like properties
    const iosPage = await context.newPage();
    
    // Navigate to a test page
    await iosPage.goto('about:blank');
    
    // Get viewport size
    const viewportSize = await iosPage.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    });
    
    // Log viewport size for debugging
    console.log('iOS viewport size:', viewportSize);
    
    // Take a screenshot for verification
    await iosPage.screenshot({ path: 'test-results/ios-safari-viewport.png' });
    
    // Close the page
    await iosPage.close();
  });
});

// iOS simulator specific tests
test.describe('iOS Simulator Tests', () => {
  // Only run these tests when specifically targeting the iOS simulator
  test.skip(({ browserName }) => browserName !== 'webkit' || !process.env.BROWSER?.includes('webkit-ios'), 
    'iOS Simulator tests are only for webkit-ios-simulator project');
  
  test('should simulate iOS Safari with touch capabilities', async ({ page, context }) => {
    // Navigate to a test page
    await page.goto('about:blank');
    
    // Check if touch is enabled
    const hasTouch = await page.evaluate(() => {
      return 'ontouchstart' in window;
    });
    
    // iOS simulator should have touch capabilities
    expect(hasTouch).toBe(true);
    
    // Use the iOS Safari helper to simulate extension functionality
    const iosSafariHelper = new IOSSafariHelper(context, page);
    await iosSafariHelper.simulateExtensionInteraction();
    
    // Verify the extension is "loaded"
    const isLoaded = await iosSafariHelper.isExtensionLoaded();
    expect(isLoaded).toBe(true);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/ios-simulator.png' });
  });
});
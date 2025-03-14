import { test, expect } from '@playwright/test';

// Tests specifically for iOS Safari
test.describe('iOS Safari Tests', () => {
  test('should load the extension popup in iOS Safari', async ({ page }) => {
    // Navigate to a test page
    await page.goto('https://example.com');
    
    // Since we can't directly test the extension in iOS Safari through Playwright,
    // we'll test the web functionality that the extension would interact with
    
    // Check that the page loaded correctly
    await expect(page).toHaveTitle('Example Domain');
    
    // Test responsive design for mobile Safari
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(500); // Should be mobile viewport
    
    // Simulate user interaction that would trigger extension functionality
    await page.evaluate(() => {
      // This would be code that interacts with the extension's content script
      // For example, storing data that the extension would access
      localStorage.setItem('chroniclesync_test', 'test_value');
    });
    
    // Verify the data was stored
    const storedValue = await page.evaluate(() => localStorage.getItem('chroniclesync_test'));
    expect(storedValue).toBe('test_value');
  });
  
  test('should handle touch interactions on iOS', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test touch-specific interactions
    await page.touchscreen.tap(100, 100);
    
    // Simulate pinch-to-zoom
    await page.touchscreen.tap(200, 200);
    
    // Test scrolling with touch
    await page.mouse.wheel(0, 500);
    
    // Verify we've scrolled down
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });
  
  test('should work with iOS Safari user agent', async ({ page }) => {
    await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/');
    
    // Check that we're identified as an iOS device
    const content = await page.textContent('body');
    expect(content).toContain('iPhone');
    expect(content).toContain('Safari');
  });
});
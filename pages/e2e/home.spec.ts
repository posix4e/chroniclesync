import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page and take screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the main content to be visible
    await page.waitForSelector('main', { state: 'visible' });
    
    // Take a screenshot of the entire page
    await page.screenshot({ 
      path: './test-results/home-page.png',
      fullPage: true 
    });
    
    // Basic assertion to ensure the page loaded
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
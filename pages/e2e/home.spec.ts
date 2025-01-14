import { test, expect } from '@playwright/test';

test.describe('Web App', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');
    
    // Take a screenshot before any interactions
    await page.screenshot({ 
      path: './test-results/landing-page.png',
      fullPage: true 
    });

    // Verify page title
    const title = await page.title();
    expect(title).toBe('ChronicleSync');

    // Verify main content is visible
    const main = await page.locator('main').first();
    await expect(main).toBeVisible();

    // Verify key elements are present
    const heading = await page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('ChronicleSync');
  });
});
import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
  });

  test('should load the landing page with correct title and content', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle('ChronicleSync - IndexedDB Synchronization Service');
    
    // Take a screenshot for visual reference
    await page.screenshot({
      path: './test-results/landing-page.png',
      fullPage: true
    });
  });

  test('should display main navigation elements', async ({ page }) => {
    // Check navigation links
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Health' })).toBeVisible();
  });

  test('should show feature highlights', async ({ page }) => {
    // Check for main feature sections
    await expect(page.getByText('Real-time Synchronization')).toBeVisible();
    await expect(page.getByText('Secure Data Transfer')).toBeVisible();
    await expect(page.getByText('Cross-browser Support')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Test navigation to different sections
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page).toHaveURL(/.*\/admin/);
    
    await page.getByRole('link', { name: 'Health' }).click();
    await expect(page).toHaveURL(/.*\/health/);
    
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/.*\//);
  });

  test('should be responsive', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('nav')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('nav')).toBeVisible();
  });
});
import { test, expect } from '@playwright/test';

test.describe('ChronicleSync Pages', () => {
  test('should load the main page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /ChronicleSync/i })).toBeVisible();
  });

  test('should show search interface', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder(/Search history/i)).toBeVisible();
  });

  test('should show empty state when no history', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/No history items found/i)).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Dashboard/i }).click();
    await expect(page.url()).toContain('/dashboard');
  });
});
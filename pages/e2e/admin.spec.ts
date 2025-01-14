import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should show login form initially', async ({ page }) => {
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid password')).toBeVisible();
  });

  test('should access admin panel with correct password', async ({ page }) => {
    // Note: In a real test, you'd use an environment variable or test config for this
    await page.getByLabel('Password').fill('test-admin-password');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify admin panel is shown
    await expect(page.getByText('Admin Panel')).toBeVisible();
    await expect(page.getByText('Connected Clients')).toBeVisible();
  });

  test('should show client statistics in admin panel', async ({ page }) => {
    // Login first
    await page.getByLabel('Password').fill('test-admin-password');
    await page.getByRole('button', { name: 'Login' }).click();

    // Check statistics elements
    await expect(page.getByText('Total Clients')).toBeVisible();
    await expect(page.getByText('Active Clients')).toBeVisible();
    await expect(page.getByText('Data Transfer')).toBeVisible();
  });
});
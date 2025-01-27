import { test, expect } from '@playwright/test';

test('admin should be able to log in with correct credentials', async ({ page }) => {
  await page.goto('https://api-staging.chroniclesync.xyz');

  // Fill in admin password
  await page.fill('input[placeholder="Enter admin password"]', 'francesisthebest');
  await page.click('text=Login');

  // Verify successful login by checking if Admin Panel is visible
  await expect(page.locator('text=Admin Panel')).toBeVisible();
});

test('admin should see error with incorrect password', async ({ page }) => {
  await page.goto('https://api-staging.chroniclesync.xyz');

  // Attempt login with wrong credentials
  await page.fill('input[placeholder="Enter admin password"]', 'wrongpassword');
  await page.click('text=Login');

  // Expect alert message for invalid credentials
  await expect(page.locator('.error-message')).toHaveText('Invalid password');
});

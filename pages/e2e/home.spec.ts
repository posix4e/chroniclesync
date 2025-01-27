import { test, expect } from '@playwright/test';

test('homepage should load correctly on staging', async ({ page }) => {
  // Use the staging URL for the test
  await page.goto('http://localhost:3000/?clientId=test123');

  await expect(page).toHaveTitle(/ChronicleSync/i);

  const loginButton = page.locator('text=Login');
  await expect(loginButton).toBeVisible();

});


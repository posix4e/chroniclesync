import { test, expect } from '@playwright/test';

test('client data should load successfully', async ({ page }) => {
    await page.goto('https://api-staging.chroniclesync.xyz/?clientId=test123');
  
    // Verify the client ID is set
    await expect(page.locator('#clientId')).toHaveValue('test123');
  
    // Check for data to be displayed
    await expect(page.locator('.client-data')).toBeVisible();
  });
  
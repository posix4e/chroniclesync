import { test, expect } from '@playwright/test';

test('form should validate and submit correctly', async ({ page }) => {
    await page.goto('https://api-staging.chroniclesync.xyz');
  
    // Fill form fields
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'testuser@example.com');
  
    // Submit the form
    await page.click('text=Submit');
  
    // Check for success message
    await expect(page.locator('.success-message')).toHaveText('Form submitted successfully');
  });
  
import { test, expect } from '@playwright/test';

test('homepage should load correctly and display the title', async ({ page }) => {
  // Go to the homepage with the clientId query parameter
  await page.goto('https://liza.chroniclesync.pages.dev');

  // Check if the page displays a specific element (e.g., a title or header)
  const title = page.locator('h1');
  await expect(title).toBeVisible(); // Verify the title is visible
  await expect(title).toHaveText(/ChronicleSync/i); // Example text to validate
});

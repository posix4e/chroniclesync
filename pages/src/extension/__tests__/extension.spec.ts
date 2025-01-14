import { test, expect } from '@playwright/test';

test('extension popup should load', async ({ page }) => {
  // Navigate to the extension popup
  await page.goto('chrome-extension://*/popup.html');
  
  // Wait for the root element where React mounts
  await page.waitForSelector('#root');
  
  // Verify the popup is visible
  const root = await page.$('#root');
  expect(root).toBeTruthy();
});
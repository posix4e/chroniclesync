import { test, expect } from '@playwright/test';
import { server } from '../config';

test.describe('Pages', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto(server.webUrl);
    await expect(page).toHaveTitle(/ChronicleSync/);
    
    // Check for main components
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('API health check', async ({ request }) => {
    const apiUrl = process.env.API_URL || server.apiUrl;
    const response = await request.get(`${apiUrl}/health`);
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.healthy).toBeTruthy();
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(server.webUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });
});
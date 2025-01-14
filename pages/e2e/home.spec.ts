import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test.describe('Web App', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigate();
  });

  test('should load the landing page', async () => {
    await homePage.takePageScreenshot('landing-page');
    
    const title = await homePage.verifyTitle();
    expect(title).toBe('ChronicleSync - IndexedDB Synchronization Service');
  });

  test('should interact with health check component', async ({ page }) => {
    // Verify initial health check state
    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByText('Status:')).toBeVisible();
    await expect(page.getByText('Last Check:')).toBeVisible();
    
    // Initial state should show "Never" for last check
    const initialLastCheck = await homePage.getLastCheckTime();
    expect(initialLastCheck).toContain('Never');

    // Perform health check and wait for response
    await homePage.checkHealthStatus();
    
    // Take a screenshot after health check
    await homePage.takePageScreenshot('health-check');

    // Verify the last check time is updated to a timestamp
    const lastCheckTime = await homePage.getLastCheckTime();
    expect(lastCheckTime).not.toContain('Never');
    expect(lastCheckTime).toMatch(/Last Check:.*\d{1,2}:\d{2}/); // Should contain a time
  });
});
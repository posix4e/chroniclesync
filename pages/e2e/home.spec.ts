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
    expect(initialLastCheck).toBe('Never');

    // Perform health check
    await homePage.checkHealthStatus();
    
    // Take a screenshot after health check
    await homePage.takePageScreenshot('health-check');

    // Wait for and verify the last check time update
    await page.waitForFunction(() => {
      const timeElement = document.querySelector('text=Last Check:').nextElementSibling;
      return timeElement && timeElement.textContent !== 'Never';
    }, { timeout: 10000 });

    const lastCheckTime = await homePage.getLastCheckTime();
    expect(lastCheckTime).not.toBeNull();
    expect(lastCheckTime).not.toBe('Never');
    expect(lastCheckTime).toMatch(/\d{1,2}:\d{2}/); // Should be in HH:MM format
  });
});
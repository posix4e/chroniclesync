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
    // Log initial HTML for debugging
    console.log('Initial HTML:', await page.content());

    // Verify initial health check state
    await expect(page.getByText('System Health')).toBeVisible();
    
    // Get all text content for debugging
    const allText = await page.evaluate(() => document.body.textContent);
    console.log('All text content:', allText);
    
    // Get specific element structure
    const healthCheckStructure = await page.evaluate(() => {
      const healthSection = document.querySelector('.health-check') || document.body;
      return {
        html: healthSection.innerHTML,
        text: healthSection.textContent,
        children: Array.from(healthSection.children).map(el => ({
          tagName: el.tagName,
          className: el.className,
          textContent: el.textContent
        }))
      };
    });
    console.log('Health check structure:', healthCheckStructure);

    // Click the health check button and wait for response
    const checkButton = await page.getByRole('button', { name: 'Check Health' });
    await checkButton.click();

    // Wait for network idle to ensure request completes
    await page.waitForLoadState('networkidle');

    // Log the updated HTML
    console.log('Updated HTML:', await page.content());

    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

    // Get the last check time element's properties
    const lastCheckElement = await page.locator('text=Last Check:').first();
    const elementInfo = await lastCheckElement.evaluate(el => ({
      textContent: el.textContent,
      innerHTML: el.innerHTML,
      outerHTML: el.outerHTML,
      nextSibling: el.nextSibling ? {
        textContent: el.nextSibling.textContent,
        nodeType: el.nextSibling.nodeType
      } : null
    }));
    console.log('Last Check element info:', elementInfo);
  });
});
import { test, expect, getExtensionUrl } from './utils/extension';
import { config } from '../src/config';

test.describe('History Feature', () => {
  test('should initialize with client ID and track history', async ({ context, extensionId }) => {
    // Load the extension popup
    const page = await context.newPage();
    await page.goto(getExtensionUrl(extensionId, 'popup.html'));
    await page.screenshot({ path: 'test-results/popup-initial.png' });

    // Enter client ID
    const clientId = 'test-client-123';
    await page.fill('#clientId', clientId);
    await page.screenshot({ path: 'test-results/popup-with-id.png' });

    // Initialize
    await page.click('button:has-text("Initialize")');
    
    // Wait for initialization
    await page.waitForSelector('button:has-text("View History")');
    await page.screenshot({ path: 'test-results/popup-initialized.png' });

    // Create a new page and navigate to trigger history tracking
    const testPage = await context.newPage();
    await testPage.goto('https://example.com');
    await testPage.screenshot({ path: 'test-results/test-page.png' });

    // View history
    await page.click('button:has-text("View History")');
    
    // Should open history page
    const historyPage = await context.waitForEvent('page');
    expect(historyPage.url()).toBe(`${config.workerUrl}/history/${clientId}`);
    await historyPage.screenshot({ path: 'test-results/history-page.png' });
  });

  test('should handle invalid client ID', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(getExtensionUrl(extensionId, 'popup.html'));

    // Try to initialize without client ID
    await page.click('button:has-text("Initialize")');
    await expect(page.locator('.error')).toHaveText('Please enter a Client ID');
    await page.screenshot({ path: 'test-results/error-no-id.png' });

    // Try invalid client ID
    await page.fill('#clientId', 'invalid-id');
    await page.click('button:has-text("Initialize")');
    await expect(page.locator('.error')).toHaveText('Invalid Client ID');
    await page.screenshot({ path: 'test-results/error-invalid-id.png' });
  });
});
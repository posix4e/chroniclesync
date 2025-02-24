import { test, expect, getExtensionUrl } from './utils/extension';

test.describe('History View', () => {
  test('history view should load and display entries', async ({ context, extensionId }) => {
    // First, set up a client ID through the settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));

    // Wait for initial mnemonic generation
    await settingsPage.waitForTimeout(1000);
    let mnemonic = await settingsPage.locator('#mnemonic').inputValue();
    let clientId = await settingsPage.locator('#clientId').inputValue();

    // Wait for up to 5 seconds for the mnemonic to be generated
    for (let i = 0; i < 5; i++) {
      if (mnemonic && clientId) break;
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
    }

    // If still no mnemonic, try generating one
    if (!mnemonic || !clientId) {
      await settingsPage.locator('#generateMnemonic').click();
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
    }

    // Save the settings
    await settingsPage.locator('#saveSettings').click();
    await settingsPage.waitForTimeout(1000);

    // Create some test history entries
    const testPages = [
      'https://example.com',
      'https://test.com',
      'https://demo.com'
    ];

    // Visit test pages to create history entries
    for (const url of testPages) {
      const page = await context.newPage();
      await page.goto(url);
      await page.waitForTimeout(500);
      await page.close();
    }

    // Open the history view
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));

    // Wait for the history entries to load
    await historyPage.waitForTimeout(1000);

    // Check for history entries
    const historyEntries = await historyPage.locator('.history-item').count();
    expect(historyEntries).toBeGreaterThan(0);

    // Test search functionality
    const searchInput = historyPage.locator('.history-search');
    await searchInput.fill('example');
    await historyPage.waitForTimeout(500);

    // Verify filtered results
    const filteredEntries = await historyPage.locator('.history-item').count();
    expect(filteredEntries).toBeLessThanOrEqual(historyEntries);

    // Test pagination if there are enough entries
    if (historyEntries > 10) {
      const nextButton = historyPage.locator('button:text("Next")');
      await nextButton.click();
      await historyPage.waitForTimeout(500);
      
      // Verify we're on page 2
      const pageText = await historyPage.locator('.pagination span').textContent();
      expect(pageText).toContain('Page 2');
    }

    // Check for console errors
    const errors: string[] = [];
    historyPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await historyPage.waitForTimeout(1000);
    expect(errors).toEqual([]);

    // Take a screenshot of the history view
    await historyPage.screenshot({
      path: 'test-results/history-view.png',
      fullPage: true
    });
  });

  test('history button in popup should open history view', async ({ context, extensionId }) => {
    // Open the popup
    const popupPage = await context.newPage();
    await popupPage.goto(getExtensionUrl(extensionId, 'popup.html'));

    // Click the history button
    await popupPage.locator('button:text("View History")').click();
    await popupPage.waitForTimeout(1000);

    // Get all pages
    const pages = context.pages();
    const historyPage = pages.find(page => 
      page.url().includes('history.html')
    );

    // Verify history page was opened
    expect(historyPage).toBeTruthy();
    if (historyPage) {
      await expect(historyPage.locator('.history-container')).toBeVisible();
    }
  });
});
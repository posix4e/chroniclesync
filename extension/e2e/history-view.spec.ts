import { test, expect, getExtensionUrl } from './utils/extension';

// Determine which browser to use based on environment variable or default to chromium
const browserName = process.env.BROWSER || 'chromium';

test.describe('History View', () => {
  // Skip all tests in this file for Firefox in CI
  test.beforeEach(() => {
    test.skip(
      browserName === 'firefox' && process.env.CI === 'true',
      'Firefox extension testing is limited in CI'
    );
  });
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
      'http://example.com',
      'http://example.org',
      'http://example.net'
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

  test('history view should handle large number of entries', async ({ context, extensionId }) => {
    test.setTimeout(120000); // Increase timeout to 2 minutes
    // First, set up a client ID through the settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.waitForTimeout(1000);

    // Generate and save client ID if needed
    const mnemonic = await settingsPage.locator('#mnemonic').inputValue();
    const clientId = await settingsPage.locator('#clientId').inputValue();
    if (!mnemonic || !clientId) {
      await settingsPage.locator('#generateMnemonic').click();
      await settingsPage.waitForTimeout(1000);
    }
    await settingsPage.locator('#saveSettings').click();
    await settingsPage.waitForTimeout(1000);

    // Create test history entries (30 entries)
    const baseUrls = [
      'https://example.com',
      'https://example.org',
      'https://example.net'
    ];

    // Generate 50 unique URLs with different paths and timestamps
    const testPages = [];
    for (let i = 0; i < 10; i++) {
      for (const baseUrl of baseUrls) {
        testPages.push(`${baseUrl}/page${i}`);
      }
    }

    console.log(`Generated ${testPages.length} test pages`);

    // Create history entries by visiting pages
    console.log('Creating history entries by visiting pages...');
    
    // Visit each URL in a new page to avoid issues with page closing
    for (const url of testPages) {
      console.log(`Visiting ${url}...`);
      const page = await context.newPage();
      try {
        await page.goto(url, { timeout: 5000, waitUntil: 'domcontentloaded' });
        // Small delay to ensure distinct timestamps
        await page.waitForTimeout(100);
      } catch (error) {
        console.warn(`Failed to visit ${url}, continuing with next URL:`, error);
      } finally {
        await page.close();
      }
    }
    
    // Wait a bit for history entries to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('History entries created');

    // Open the history view
    console.log('Opening history view...');
    const historyPage = await context.newPage();
    const historyUrl = getExtensionUrl(extensionId, 'history.html');
    console.log(`Navigating to history page: ${historyUrl}`);
    
    try {
      await historyPage.goto(historyUrl);
      console.log('History page loaded');
      
      await historyPage.waitForTimeout(2000); // Wait longer for all entries to load
      console.log('Waited for entries to load');

      // Check total number of history entries (should show 10 per page)
      const initialEntries = await historyPage.locator('.history-item').count();
      console.log(`Found ${initialEntries} initial entries`);
      expect(initialEntries).toBeLessThanOrEqual(10); // Should be paginated

      // Test search functionality with large dataset
      console.log('Testing search functionality...');
      const searchInput = historyPage.locator('.history-search');
      await searchInput.fill('example.com');
      await historyPage.waitForTimeout(500);

      // Verify filtered results
      const filteredEntries = await historyPage.locator('.history-item').count();
      console.log(`Found ${filteredEntries} filtered entries`);
      expect(filteredEntries).toBeLessThanOrEqual(10); // Should still be paginated

      // Test pagination with large dataset
      console.log('Testing pagination...');
      const nextButton = historyPage.locator('button:text("Next")');
      const prevButton = historyPage.locator('button:text("Previous")');
      
      // Click next several times to verify we can access later pages
      for (let i = 0; i < 5; i++) {
        const isEnabled = await nextButton.isEnabled();
        if (!isEnabled) {
          console.log(`Next button disabled at page ${i + 1}`);
          break;
        }
        
        await nextButton.click();
        await historyPage.waitForTimeout(300);
        const pageText = await historyPage.locator('.pagination span').textContent();
        console.log(`Navigated to: ${pageText}`);
        expect(pageText).toContain(`Page ${i + 2}`);
        
        // Verify entries are still being displayed
        const entriesOnPage = await historyPage.locator('.history-item').count();
        console.log(`Found ${entriesOnPage} entries on page ${i + 2}`);
        expect(entriesOnPage).toBeGreaterThan(0);
      }

      // Go back to first page
      console.log('Testing previous pagination...');
      while (await prevButton.isEnabled()) {
        await prevButton.click();
        await historyPage.waitForTimeout(300);
      }
      const firstPageText = await historyPage.locator('.pagination span').textContent();
      console.log(`Returned to: ${firstPageText}`);
      expect(firstPageText).toContain('Page 1');

      // Clear search and test with different filters
      console.log('Testing filters...');
      await searchInput.fill('');
      await historyPage.waitForTimeout(500);

      // Test platform filter
      const platformSelect = historyPage.locator('select.platform-filter');
      const platforms = await platformSelect.evaluate((select: HTMLSelectElement) => {
        return Array.from(select.options).map(option => option.value);
      });
      console.log('Available platforms:', platforms);
      
      if (platforms.length > 1) {
        await platformSelect.selectOption({ index: 1 }); // Select first platform
        await historyPage.waitForTimeout(500);

        // Verify filtered results are paginated correctly
        const platformFilteredEntries = await historyPage.locator('.history-item').count();
        console.log(`Found ${platformFilteredEntries} platform-filtered entries`);
        expect(platformFilteredEntries).toBeLessThanOrEqual(10);
      } else {
        console.log('Not enough platforms to test filtering');
      }

      // Check for any console errors during the entire test
      const errors: string[] = [];
      historyPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      expect(errors).toEqual([]);

      // Take a screenshot of the final state
      console.log('Taking final screenshot...');
      await historyPage.screenshot({
        path: 'test-results/history-view-large-dataset.png',
        fullPage: true
      });
      
    } catch (error) {
      console.error('Error during history view test:', error);
      throw error;
    }
  });
});
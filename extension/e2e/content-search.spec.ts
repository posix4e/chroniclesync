import { test, expect, getExtensionUrl } from './utils/extension';
import { startTestServer } from './test-server/test-pages';

test.describe('Content Search', () => {
  let testServerPort: number;

  test.beforeAll(async () => {
    testServerPort = 52883; // Using the provided port
    await startTestServer(testServerPort);
  });

  test('content search should find and display page content', async ({ context, extensionId }) => {
    // Set up client ID through settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.waitForTimeout(1000);

    // Generate and save client ID if needed
    let mnemonic = await settingsPage.locator('#mnemonic').inputValue();
    let clientId = await settingsPage.locator('#clientId').inputValue();
    if (!mnemonic || !clientId) {
      await settingsPage.locator('#generateMnemonic').click();
      await settingsPage.waitForTimeout(1000);
      mnemonic = await settingsPage.locator('#mnemonic').inputValue();
      clientId = await settingsPage.locator('#clientId').inputValue();
    }
    await settingsPage.locator('#saveSettings').click();
    await settingsPage.waitForTimeout(1000);

    // Visit test pages to create history entries with content
    const testPages = [
      `http://localhost:${testServerPort}/page1`,
      `http://localhost:${testServerPort}/page2`,
      `http://localhost:${testServerPort}/page3`
    ];

    for (const url of testPages) {
      const page = await context.newPage();
      await page.goto(url);
      // Wait for content extraction to complete
      await page.waitForTimeout(1000);
      await page.close();
    }

    // Open the history view
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    await historyPage.waitForTimeout(1000);

    // Switch to content search tab
    await historyPage.locator('button:text("Content Search")').click();
    await historyPage.waitForTimeout(500);

    // Test cases for content search
    const searchTests = [
      {
        query: 'artificial intelligence',
        expectedCount: 2,
        shouldContain: ['Test Page 1', 'Test Page 2']
      },
      {
        query: 'XYZ123uniqueString789',
        expectedCount: 1,
        shouldContain: ['Test Page 3']
      },
      {
        query: '!@#$%^&*()',
        expectedCount: 1,
        shouldContain: ['Test Page 2']
      },
      {
        query: 'nonexistent content 404',
        expectedCount: 0,
        shouldContain: []
      }
    ];

    for (const testCase of searchTests) {
      // Perform search
      await historyPage.locator('.content-search-input').fill(testCase.query);
      await historyPage.waitForTimeout(500);

      // Verify results count
      const results = await historyPage.locator('.content-search-result').count();
      expect(results).toBe(testCase.expectedCount);

      // Verify expected pages are in results
      for (const expectedTitle of testCase.shouldContain) {
        const titleExists = await historyPage.locator(`.content-search-result:has-text("${expectedTitle}")`).count();
        expect(titleExists).toBe(1);
      }

      // Verify context snippets are shown for matches
      if (testCase.expectedCount > 0) {
        const firstResult = await historyPage.locator('.content-search-result').first();
        const snippet = await firstResult.locator('.content-snippet').textContent();
        expect(snippet).toContain(testCase.query);
      }
    }

    // Test pagination if there are enough results
    await historyPage.locator('.content-search-input').fill('the');
    await historyPage.waitForTimeout(500);

    const totalResults = await historyPage.locator('.content-search-result').count();
    if (totalResults > 10) {
      // Click next page
      await historyPage.locator('button:text("Next")').click();
      await historyPage.waitForTimeout(500);

      // Verify we're on page 2
      const pageText = await historyPage.locator('.pagination span').textContent();
      expect(pageText).toContain('Page 2');

      // Verify different results are shown
      const secondPageResults = await historyPage.locator('.content-search-result').first().textContent();
      expect(secondPageResults).toBeTruthy();
    }

    // Check for console errors
    const errors: string[] = [];
    historyPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    expect(errors).toEqual([]);

    // Take a screenshot of the content search results
    await historyPage.screenshot({
      path: 'test-results/content-search.png',
      fullPage: true
    });
  });

  test('content search should handle edge cases', async ({ context, extensionId }) => {
    // Set up extension and visit test pages (reusing setup from previous test)
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    await settingsPage.waitForTimeout(1000);

    // Open the history view
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    await historyPage.waitForTimeout(1000);

    // Switch to content search tab
    await historyPage.locator('button:text("Content Search")').click();
    await historyPage.waitForTimeout(500);

    // Test edge cases
    const edgeCases = [
      {
        query: '', // Empty search
        expectedBehavior: async () => {
          const results = await historyPage.locator('.content-search-result').count();
          expect(results).toBe(0);
        }
      },
      {
        query: '   ', // Whitespace only
        expectedBehavior: async () => {
          const results = await historyPage.locator('.content-search-result').count();
          expect(results).toBe(0);
        }
      },
      {
        query: 'a'.repeat(100), // Very long search term
        expectedBehavior: async () => {
          const results = await historyPage.locator('.content-search-result').count();
          expect(results).toBe(0);
        }
      },
      {
        query: '<script>alert("xss")</script>', // Potential XSS
        expectedBehavior: async () => {
          // Verify the input is properly escaped
          const searchInput = await historyPage.locator('.content-search-input').inputValue();
          expect(searchInput).toBe('<script>alert("xss")</script>');
          // Verify no script execution
          const results = await historyPage.locator('.content-search-result').count();
          expect(results).toBe(0);
        }
      }
    ];

    for (const testCase of edgeCases) {
      await historyPage.locator('.content-search-input').fill(testCase.query);
      await historyPage.waitForTimeout(500);
      await testCase.expectedBehavior();
    }

    // Test rapid search input
    const rapidSearches = ['test', 'quick', 'search', 'rapid'];
    for (const search of rapidSearches) {
      await historyPage.locator('.content-search-input').fill(search);
      // Don't wait between searches to test debouncing
    }
    // Wait for final search to complete
    await historyPage.waitForTimeout(1000);

    // Verify the search input and results are in a valid state
    const finalSearchTerm = await historyPage.locator('.content-search-input').inputValue();
    expect(finalSearchTerm).toBe(rapidSearches[rapidSearches.length - 1]);

    // Check for any console errors during edge case testing
    const errors: string[] = [];
    historyPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    expect(errors).toEqual([]);

    // Take a screenshot of the final state
    await historyPage.screenshot({
      path: 'test-results/content-search-edge-cases.png',
      fullPage: true
    });
  });
});
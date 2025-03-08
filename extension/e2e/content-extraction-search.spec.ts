import { test, expect, getExtensionUrl } from './utils/extension';
import { server } from './test-config';

test.describe('Content Extraction and Search', () => {
  // Test for content extraction when visiting a page
  test('should extract content from a webpage', async ({ context, extensionId, page }) => {
    // First, set up a client ID through the settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    
    // Fill in the client ID
    await settingsPage.fill('#clientId', 'test-client-id');
    await settingsPage.click('#saveSettings');
    
    // Wait for the save to complete
    await settingsPage.waitForSelector('.success-message');
    await settingsPage.close();
    
    // Create a test page with known content
    const testPage = await context.newPage();
    
    // Navigate to a page with predictable content
    await testPage.goto('https://example.com');
    
    // Inject some test content to make the page more substantial for extraction
    await testPage.evaluate(() => {
      const article = document.createElement('article');
      article.innerHTML = `
        <h1>Test Article Title</h1>
        <p>This is a test paragraph with some unique content that we can search for later.</p>
        <p>The Chronicle Sync extension should extract this content and make it searchable.</p>
        <p>This test verifies that the content extraction functionality works correctly.</p>
        <p>We will search for the term "unique content" to verify the search functionality.</p>
      `;
      document.body.appendChild(article);
    });
    
    // Wait for content script to process the page (content extraction happens after page load)
    await testPage.waitForTimeout(2000);
    
    // Close the test page
    await testPage.close();
    
    // Open the history page to verify the content was extracted
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    
    // Wait for history to load
    await historyPage.waitForSelector('.history-item');
    
    // Search for the unique content we added
    await historyPage.fill('.search-input', 'unique content');
    await historyPage.click('.search-button');
    
    // Wait for search results
    await historyPage.waitForSelector('.search-results', { timeout: 5000 });
    
    // Verify search results contain our test content
    const searchResultsCount = await historyPage.locator('.search-results-header h3').textContent();
    expect(searchResultsCount).toContain('Search Results');
    
    // Check if our specific content is in the results
    const resultText = await historyPage.locator('.search-result-context').first().innerHTML();
    expect(resultText).toContain('unique content');
    
    // Verify the URL in the search results matches example.com
    const resultUrl = await historyPage.locator('.search-result-title a').first().getAttribute('href');
    expect(resultUrl).toContain('example.com');
    
    await historyPage.close();
  });
  
  // Test for searching content across multiple pages
  test('should search content across multiple pages', async ({ context, extensionId }) => {
    // First, set up a client ID through the settings page if not already done
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    
    // Fill in the client ID
    await settingsPage.fill('#clientId', 'test-client-id');
    await settingsPage.click('#saveSettings');
    
    // Wait for the save to complete
    await settingsPage.waitForSelector('.success-message');
    await settingsPage.close();
    
    // Create and visit multiple test pages with different content
    const testPages = [
      {
        url: 'https://example.com/page1',
        content: 'This page contains information about apples and fruits.'
      },
      {
        url: 'https://example.com/page2',
        content: 'This page contains information about bananas and fruits.'
      },
      {
        url: 'https://example.com/page3',
        content: 'This page is about vegetables, not fruits.'
      }
    ];
    
    // Visit each test page and inject content
    for (const testPage of testPages) {
      const page = await context.newPage();
      
      // Override the URL for the page context
      await page.route('**/*', route => {
        if (route.request().url() === testPage.url) {
          return route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body><h1>Test Page</h1></body></html>'
          });
        }
        return route.continue();
      });
      
      await page.goto(testPage.url);
      
      // Inject test content
      await page.evaluate((content) => {
        const article = document.createElement('article');
        article.innerHTML = `
          <h1>Test Page</h1>
          <p>${content}</p>
        `;
        document.body.appendChild(article);
      }, testPage.content);
      
      // Wait for content script to process the page
      await page.waitForTimeout(2000);
      
      // Close the test page
      await page.close();
    }
    
    // Open the history page to search across all pages
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    
    // Wait for history to load
    await historyPage.waitForSelector('.history-item');
    
    // Search for "fruits" which should appear in 2 of the 3 pages
    await historyPage.fill('.search-input', 'fruits');
    await historyPage.click('.search-button');
    
    // Wait for search results
    await historyPage.waitForSelector('.search-results', { timeout: 5000 });
    
    // Verify we get results from the pages containing "fruits"
    const resultItems = await historyPage.locator('.search-result-item').count();
    expect(resultItems).toBeGreaterThanOrEqual(2);
    
    // Clear search results
    await historyPage.click('.clear-results-button');
    
    // Search for "vegetables" which should appear in only 1 page
    await historyPage.fill('.search-input', 'vegetables');
    await historyPage.click('.search-button');
    
    // Wait for search results
    await historyPage.waitForSelector('.search-results', { timeout: 5000 });
    
    // Verify we get results from only the page containing "vegetables"
    const vegetableResults = await historyPage.locator('.search-result-item').count();
    expect(vegetableResults).toBe(1);
    
    await historyPage.close();
  });
  
  // Test for the search UI components and interactions
  test('should have functional search UI components', async ({ context, extensionId }) => {
    // Open the history page
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    
    // Verify search input and button exist
    await historyPage.waitForSelector('.search-input');
    await historyPage.waitForSelector('.search-button');
    
    // Test empty search validation
    await historyPage.click('.search-button');
    const errorMessage = await historyPage.locator('.search-error').textContent();
    expect(errorMessage).toContain('Please enter a search term');
    
    // Enter a search term that likely won't match anything
    await historyPage.fill('.search-input', 'xyznonexistentterm123');
    await historyPage.click('.search-button');
    
    // Wait for search to complete (either no results or results)
    await historyPage.waitForTimeout(2000);
    
    // If we got results, there should be a clear button
    const hasResults = await historyPage.locator('.search-results').count() > 0;
    
    if (hasResults) {
      // Test the clear results functionality
      await historyPage.click('.clear-results-button');
      
      // Verify results are cleared
      const resultsAfterClear = await historyPage.locator('.search-results').count();
      expect(resultsAfterClear).toBe(0);
    }
    
    await historyPage.close();
  });
});
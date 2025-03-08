import { test, expect, getExtensionUrl } from './utils/extension';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Content Extraction with Test Page', () => {
  // Test using a local test HTML file
  test('should extract content from test HTML page', async ({ context, extensionId }) => {
    // First, set up a client ID through the settings page
    const settingsPage = await context.newPage();
    await settingsPage.goto(getExtensionUrl(extensionId, 'settings.html'));
    
    // Fill in the client ID
    await settingsPage.fill('#clientId', 'test-client-id');
    await settingsPage.click('#saveSettings');
    
    // Wait for the save to complete
    await settingsPage.waitForSelector('.success-message');
    await settingsPage.close();
    
    // Get the path to our test HTML file
    const testPagePath = path.join(__dirname, 'test-pages', 'content-test.html');
    const testPageContent = fs.readFileSync(testPagePath, 'utf8');
    
    // Create a test page and load our HTML content
    const testPage = await context.newPage();
    
    // Serve the test page content
    await testPage.route('**/test-content-page', route => {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: testPageContent
      });
    });
    
    // Navigate to the test page
    await testPage.goto('https://example.com/test-content-page');
    
    // Wait for content script to process the page
    await testPage.waitForTimeout(2000);
    
    // Close the test page
    await testPage.close();
    
    // Open the history page to verify the content was extracted
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    
    // Wait for history to load
    await historyPage.waitForSelector('.history-item');
    
    // Test each of our unique markers
    const testMarkers = [
      'CHRONICLE_TEST_MARKER_ALPHA',
      'CHRONICLE_TEST_MARKER_BETA',
      'CHRONICLE_TEST_MARKER_GAMMA'
    ];
    
    for (const marker of testMarkers) {
      // Search for the marker
      await historyPage.fill('.search-input', marker);
      await historyPage.click('.search-button');
      
      // Wait for search results
      await historyPage.waitForSelector('.search-results', { timeout: 5000 });
      
      // Verify search results contain our marker
      const resultText = await historyPage.locator('.search-result-context').first().innerHTML();
      expect(resultText).toContain(marker);
      
      // Clear results for next search
      await historyPage.click('.clear-results-button');
      await historyPage.waitForTimeout(500);
    }
    
    // Test that the extraction prioritized article content
    // Search for text that appears in the article but not in navigation/footer
    await historyPage.fill('.search-input', 'content extraction algorithm');
    await historyPage.click('.search-button');
    
    // Wait for search results
    await historyPage.waitForSelector('.search-results', { timeout: 5000 });
    
    // Verify we found the article content
    const articleContentResult = await historyPage.locator('.search-result-context').first().innerHTML();
    expect(articleContentResult).toContain('content extraction algorithm');
    
    // Clear results
    await historyPage.click('.clear-results-button');
    await historyPage.waitForTimeout(500);
    
    // Test that navigation content was not prioritized
    // This might find results if all page content was extracted, but it should not be in the summary
    await historyPage.fill('.search-input', 'navigation content');
    await historyPage.click('.search-button');
    
    // Check if we got any results
    const navigationResults = await historyPage.locator('.search-results').count();
    
    // If we got results, verify the URL matches our test page
    if (navigationResults > 0) {
      const resultUrl = await historyPage.locator('.search-result-title a').first().getAttribute('href');
      expect(resultUrl).toContain('test-content-page');
    }
    
    await historyPage.close();
  });
  
  // Test the summary generation functionality
  test('should generate a summary of extracted content', async ({ context, extensionId }) => {
    // Create a test page with content that has clear important sentences
    const testPage = await context.newPage();
    
    // Create HTML with sentences of varying importance
    const testHtml = `
      <html>
        <head><title>Summary Test Page</title></head>
        <body>
          <article>
            <h1>Testing Summary Generation</h1>
            <p>This is a very important sentence with key terms that should appear in the summary.</p>
            <p>This is a less important sentence without key terms.</p>
            <p>Another important sentence mentioning key terms and summary generation testing.</p>
            <p>This sentence has key terms like extraction and summary that should be detected.</p>
            <p>This is a filler sentence without much value.</p>
            <p>Important content about Chronicle Sync and its content extraction capabilities.</p>
            <p>More text about Chronicle Sync and how it generates summaries of web pages.</p>
          </article>
        </body>
      </html>
    `;
    
    // Serve the test page content
    await testPage.route('**/summary-test-page', route => {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: testHtml
      });
    });
    
    // Navigate to the test page
    await testPage.goto('https://example.com/summary-test-page');
    
    // Wait for content script to process the page
    await testPage.waitForTimeout(2000);
    
    // Close the test page
    await testPage.close();
    
    // Open the history page
    const historyPage = await context.newPage();
    await historyPage.goto(getExtensionUrl(extensionId, 'history.html'));
    
    // Wait for history to load
    await historyPage.waitForSelector('.history-item');
    
    // Search for key terms that should be in the summary
    const keyTerms = ['important', 'key terms', 'Chronicle Sync', 'summary generation'];
    
    for (const term of keyTerms) {
      // Search for the term
      await historyPage.fill('.search-input', term);
      await historyPage.click('.search-button');
      
      // Wait for search results
      await historyPage.waitForSelector('.search-results', { timeout: 5000 });
      
      // Verify we found results
      const hasResults = await historyPage.locator('.search-result-item').count() > 0;
      expect(hasResults).toBe(true);
      
      // Clear results for next search
      await historyPage.click('.clear-results-button');
      await historyPage.waitForTimeout(500);
    }
    
    await historyPage.close();
  });
});
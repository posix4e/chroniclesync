// Import content extractor
import { extractPageContent, searchContent } from './utils/content-extractor.js';

// Extract content when the page loads
function processPageContent() {
  try {
    const pageContent = extractPageContent();
    
    // Send the extracted content to the background script
    browser.runtime.sendMessage({
      type: 'pageContentExtracted',
      data: {
        url: window.location.href,
        title: document.title,
        content: pageContent.content,
        summary: pageContent.summary,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error extracting page content:', error);
  }
}

// Process content after the page has fully loaded
window.addEventListener('load', () => {
  // Wait a bit for dynamic content to load
  setTimeout(processPageContent, 1000);
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'searchPageContent') {
    const { query } = request;
    try {
      const pageContent = extractPageContent();
      const searchResults = searchContent(pageContent.content, query);
      sendResponse({ success: true, results: searchResults });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
    return true; // Will respond asynchronously
  }
});

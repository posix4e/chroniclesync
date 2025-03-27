// Content script to extract and summarize webpage content
import { extractPageContent } from './utils/content-extractor.js';

// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

// Extract content when the page loads
function processPageContent() {
  try {
    const pageContent = extractPageContent();
    
    // Send the extracted content to the background script
    browserAPI.runtime.sendMessage({
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
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

// Function to search content and return matches with context
function searchContent(content, query) {
  if (!query || !content) return [];
  
  const results = [];
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  let startIndex = 0;
  while (startIndex < lowerContent.length) {
    const foundIndex = lowerContent.indexOf(lowerQuery, startIndex);
    if (foundIndex === -1) break;
    
    // Get context around the match (100 chars before and after)
    const contextStart = Math.max(0, foundIndex - 100);
    const contextEnd = Math.min(content.length, foundIndex + query.length + 100);
    const matchText = content.substring(foundIndex, foundIndex + query.length);
    const context = content.substring(contextStart, contextEnd);
    
    results.push({
      text: matchText,
      context: context
    });
    
    startIndex = foundIndex + query.length;
  }
  
  return results;
}
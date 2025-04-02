// Content script to extract and summarize webpage content
import { extractPageContent } from './utils/content-extractor';

// Extract content when the page loads
function processPageContent() {
  try {
    const pageContent = extractPageContent();
    
    // Send the extracted content to the background script
    chrome.runtime.sendMessage({
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

// We no longer need to search page content directly
// All searches will be done through the background script using stored summaries
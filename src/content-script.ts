// Content script to extract and summarize webpage content
import { extractPageContent } from './utils/content-extractor';

// Extract content when the page loads
function processPageContent() {
  try {
    // Extract content and generate summary
    // Note: Content is only used locally for summary generation and is never stored or synced
    const pageContent = extractPageContent();
    
    // Send ONLY the summary to the background script
    // The content is included here but will be discarded by the background script
    chrome.runtime.sendMessage({
      type: 'pageContentExtracted',
      data: {
        url: window.location.href,
        title: document.title,
        content: pageContent.content, // This will be discarded by the background script
        summary: pageContent.summary, // Only the summary is stored
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

// We never search content directly
// All searches are done through the background script using only summaries and history information
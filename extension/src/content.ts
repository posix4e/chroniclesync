/**
 * ChronicleSync Content Script
 * Extracts content from the current page and sends it to the background script for summarization
 */

// Wait for the page to be fully loaded
if (document.readyState === 'complete') {
  extractAndSendContent();
} else {
  window.addEventListener('load', extractAndSendContent);
}

/**
 * Extract content from the page and send it to the background script
 */
function extractAndSendContent(): void {
  try {
    // Skip browser internal pages
    if (location.protocol === 'chrome:' || 
        location.protocol === 'about:' || 
        location.protocol === 'chrome-extension:') {
      return;
    }
    
    // Send message to background script to extract and summarize content
    chrome.runtime.sendMessage({
      type: 'extractAndSummarize',
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML
    });
  } catch (error) {
    console.error('ChronicleSync content script error:', error);
  }
}
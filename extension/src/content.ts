/**
 * Content script for ChronicleSync extension
 * Extracts page content and sends it to the background script for summarization
 */

// Wait for page to fully load
if (document.readyState === 'complete') {
  sendContentToBackground();
} else {
  window.addEventListener('load', () => {
    // Add a small delay to ensure dynamic content is loaded
    setTimeout(sendContentToBackground, 1000);
  });
}

/**
 * Send page content to the background script
 */
function sendContentToBackground(): void {
  // Skip browser internal pages
  if (location.protocol === 'chrome:' || 
      location.protocol === 'chrome-extension:' || 
      location.protocol === 'about:') {
    return;
  }
  
  // Extract content
  const content = extractMainContent();
  
  // Send to background script if content is substantial
  if (content && content.trim().length > 100) {
    chrome.runtime.sendMessage({
      type: 'summarizeContent',
      url: window.location.href,
      title: document.title,
      content: content
    });
  }
}

/**
 * Extract the main content from the current page
 * @returns The extracted content as a string
 */
function extractMainContent(): string {
  // Try common content selectors
  const selectors = [
    'article', 'main', '.content', '.article', '.post', 
    '[role="main"]', '#content', '#main'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim().length > 100) {
      return element.textContent;
    }
  }
  
  // Fallback to paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p'));
  if (paragraphs.length > 0) {
    return paragraphs
      .filter(p => p.textContent && p.textContent.trim().length > 40)
      .map(p => {
        const text = p.textContent;
        return text ? text.trim() : '';
      })
      .join('\n\n');
  }
  
  // Last resort: body text
  return document.body.textContent || '';
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'summarizationComplete') {
    console.log('Page summarization complete:', message.summary);
  }
});
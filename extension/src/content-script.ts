// Content script to extract page content for summarization
function extractPageContent(): string {
  // Get the main content of the page
  // First try to find the main article content
  const article = document.querySelector('article');
  if (article) {
    return article.textContent || '';
  }

  // If no article, try to find the main content
  const main = document.querySelector('main');
  if (main) {
    return main.textContent || '';
  }

  // If no main, try to find the content div
  const content = document.querySelector('[role="main"]') || 
                  document.querySelector('#content') || 
                  document.querySelector('.content');
  if (content) {
    return content.textContent || '';
  }

  // If all else fails, get the body content but exclude scripts, styles, etc.
  const bodyText = Array.from(document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'))
    .map(el => el.textContent)
    .filter(text => text && text.trim().length > 0)
    .join('\n');

  return bodyText || document.body.textContent || '';
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractContent') {
    try {
      const content = extractPageContent();
      // Trim content to a reasonable size (transformer models have token limits)
      const trimmedContent = content.substring(0, 10000);
      sendResponse({ content: trimmedContent });
    } catch (error) {
      console.error('Error extracting page content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error extracting content';
      sendResponse({ error: errorMessage });
    }
    return true; // Keep the message channel open for async response
  }
});

// Notify that the content script has loaded
console.log('ChronicleSync content script loaded');
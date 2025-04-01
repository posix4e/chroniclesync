// Content script for iOS Safari extension
// This script runs in the context of web pages

// Extract page content
function extractPageContent() {
  // Don't extract content from certain pages
  const url = window.location.href;
  if (url.startsWith('about:') || 
      url.startsWith('chrome:') || 
      url.startsWith('safari:') || 
      url.startsWith('chrome-extension:') || 
      url.startsWith('safari-extension:')) {
    return;
  }
  
  // Wait for page to fully load
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => setTimeout(extractPageContent, 1000));
    return;
  }
  
  try {
    // Get page content
    const title = document.title;
    
    // Get main content (prioritize article content)
    let content = '';
    const article = document.querySelector('article');
    
    if (article) {
      content = article.innerText;
    } else {
      // Try to get main content
      const main = document.querySelector('main');
      if (main) {
        content = main.innerText;
      } else {
        // Fall back to body content
        content = document.body.innerText;
      }
    }
    
    // Limit content size
    const maxContentLength = 50000;
    if (content.length > maxContentLength) {
      content = content.substring(0, maxContentLength);
    }
    
    // Generate a simple summary (first 200 characters)
    const summary = content.substring(0, 200).trim();
    
    // Send to background script
    browser.runtime.sendMessage({
      type: 'pageContent',
      url: window.location.href,
      title,
      content,
      summary
    });
    
    console.debug('Sent page content to background script');
  } catch (error) {
    console.error('Error extracting page content:', error);
  }
}

// Start content extraction after a delay
setTimeout(extractPageContent, 2000);
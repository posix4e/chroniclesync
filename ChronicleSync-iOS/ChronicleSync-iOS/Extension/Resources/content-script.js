// Content script for iOS Safari extension
// This script runs in the context of web pages

// Request native content summarization
function requestNativeSummarization() {
  // Don't process certain pages
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
    window.addEventListener('load', () => setTimeout(requestNativeSummarization, 1000));
    return;
  }
  
  try {
    // Send request to native code for content summarization
    browser.runtime.sendMessage({
      type: 'summarizeContent',
      url: window.location.href
    });
    
    console.debug('Requested native content summarization');
  } catch (error) {
    console.error('Error requesting content summarization:', error);
  }
}

// Start content summarization after a delay
setTimeout(requestNativeSummarization, 2000);

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'summarizationComplete') {
    console.debug('Content summarization completed:', message.success);
  }
});
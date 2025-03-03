// This file will be replaced by the build process
// The source code is in src/background.ts
console.log('Starting background service...');

// Simple placeholder for development
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  if (request.type === 'summarizeContent') {
    console.log('Content summarization requested but not available in placeholder');
    sendResponse({
      error: 'This is a placeholder background.js. Please build the extension to use the full functionality.',
      success: false
    });
    return true;
  }
  
  sendResponse({ error: 'Placeholder background.js cannot process requests' });
  return false;
});

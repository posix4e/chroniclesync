// Simple health check endpoint
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'health_check') {
    sendResponse({ status: 'healthy', timestamp: Date.now() });
    return true;
  }
});
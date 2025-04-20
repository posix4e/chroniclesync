// Safari WebExtension content script
// This is a simplified version of the Chrome extension's content-script.ts

(function() {
  // Track page visits
  function trackPageVisit() {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    };
    
    browser.runtime.sendMessage({
      action: 'pageVisited',
      pageInfo
    }).catch(error => {
      console.error('Error sending page visit data:', error);
    });
  }
  
  // Wait for the page to fully load before tracking
  if (document.readyState === 'complete') {
    trackPageVisit();
  } else {
    window.addEventListener('load', trackPageVisit);
  }
  
  // Listen for messages from the background script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPageInfo') {
      sendResponse({
        url: window.location.href,
        title: document.title,
        timestamp: Date.now()
      });
    }
    return true;
  });
})();
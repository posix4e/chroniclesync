// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    console.log('Content script: Getting page content...');
    const article = document.querySelector('article');
    if (article) {
      console.log('Content script: Found article content');
      sendResponse({ content: article.textContent });
      return;
    }
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
      console.log('Content script: Found main content');
      sendResponse({ content: mainContent.textContent });
      return;
    }

    console.log('Content script: Using body content');
    sendResponse({ content: document.body.textContent });
  }
  return true;
});
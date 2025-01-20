// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openInTab') {
    // Open the app in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('app/index.html') });
  }
});

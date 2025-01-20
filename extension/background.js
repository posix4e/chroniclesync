// The extension will use the popup by default (configured in manifest.json)
// This background script provides additional functionality

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openInTab') {
    // Open the app in a new tab when requested
    chrome.tabs.create({ url: 'http://localhost:54826' });
  }
});

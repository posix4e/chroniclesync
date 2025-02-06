function logToBackground(message) { console.debug(message); }

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
  }
});
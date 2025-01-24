chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    console.log('Navigation to:', changeInfo.url);
  }
});
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.log('Navigation to:', changeInfo.url);
  }
});
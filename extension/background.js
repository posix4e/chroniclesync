// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only log when the URL has changed and loading is complete
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Current webpage:', tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      console.log('Switched to webpage:', tab.url);
    }
  } catch (error) {
    console.error('Error getting tab info:', error);
  }
});
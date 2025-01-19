// Background script for ChronicleSync extension
let currentTab: chrome.tabs.Tab | null = null;

// Listen for tab updates
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentTab = tab;
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    sendResponse({ tab: currentTab });
    return true;
  }
});
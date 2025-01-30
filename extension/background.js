function logToBackground(message) {
  chrome.runtime.getBackgroundPage((backgroundPage) => {
    if (backgroundPage) {
      backgroundPage.console.debug(message);
    }
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const settingsUrl = chrome.runtime.getURL('settings.html');
    chrome.tabs.create({ url: settingsUrl });
    await chrome.storage.local.set({ firstTimeSetupComplete: false });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openPagesUrl') {
    const { pagesUrl, clientId } = message;
    const url = new URL(pagesUrl);
    url.searchParams.set('clientId', clientId);
    chrome.tabs.create({ url: url.toString() });
    sendResponse({ success: true });
  }
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
  }
});
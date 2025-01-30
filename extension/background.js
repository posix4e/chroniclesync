import { historyManager } from './src/history';

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.title) {
    historyManager.addToHistory(changeInfo.url, tab.title);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'SET_CLIENT_ID') {
    historyManager.setClientId(request.clientId);
    sendResponse({ success: true });
  } else if (request.type === 'GET_CLIENT_ID') {
    historyManager.getClientId().then(clientId => {
      sendResponse({ clientId });
    });
    return true; // Will respond asynchronously
  }
});
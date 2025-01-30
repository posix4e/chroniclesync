import { getConfig } from './config.js';

function logToBackground(message) {
  chrome.runtime.getBackgroundPage((backgroundPage) => {
    if (backgroundPage) {
      backgroundPage.console.debug(message);
    }
  });
}

async function openSettingsPage() {
  const settingsUrl = chrome.runtime.getURL('settings.html');
  await chrome.windows.create({
    url: settingsUrl,
    type: 'popup',
    width: 500,
    height: 600
  });
}

async function checkFirstRun() {
  const config = await getConfig();
  if (!config || !config.apiEndpoint || !config.clientId) {
    await openSettingsPage();
  }
}

// Check settings on extension install/update
chrome.runtime.onInstalled.addListener(checkFirstRun);

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
  }
});
import { getConfig } from './config.js';

function logToBackground(message) {
  chrome.runtime.getBackgroundPage((backgroundPage) => {
    if (backgroundPage) {
      backgroundPage.console.debug(message);
    }
  });
}

async function openSettings() {
  const width = 600;
  const height = 500;
  const left = Math.floor((screen.width - width) / 2);
  const top = Math.floor((screen.height - height) / 2);

  return chrome.windows.create({
    url: chrome.runtime.getURL('settings.html'),
    type: 'popup',
    width,
    height,
    left,
    top
  });
}

// Check for first run when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  const config = await getConfig();
  if (config.firstRun) {
    await openSettings();
  }
});

// Handle browser action click
chrome.action.onClicked.addListener(async () => {
  await openSettings();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    logToBackground(`Navigation to: ${changeInfo.url}`);
  }
});
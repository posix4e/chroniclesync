export function logToBackground(message) { console.debug(message); }

const API_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'chroniclesync.xyz') {
    return 'https://api.chroniclesync.xyz';
  }
  
  if (hostname.endsWith('chroniclesync.pages.dev')) {
    return 'https://api-staging.chroniclesync.xyz';
  }
  
  return 'http://localhost:8787';
})();

async function syncHistory(clientId, historyItems) {
  try {
    const response = await fetch(`${API_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId
      },
      body: JSON.stringify({
        type: 'history',
        data: historyItems
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logToBackground(`Error syncing history: ${error.message}`);
    throw error;
  }
}

export async function getClientId() {
  return new Promise((resolve) => {
    chrome.storage.local.get('clientId', (result) => {
      resolve(result.clientId);
    });
  });
}

export async function uploadHistory() {
  const clientId = await getClientId();
  if (!clientId) {
    logToBackground('No client ID set');
    return;
  }

  const oneHourAgo = new Date().getTime() - 60 * 60 * 1000;
  const historyItems = await chrome.history.search({
    text: '',
    startTime: oneHourAgo,
    maxResults: 100
  });

  const formattedHistory = historyItems.map(item => ({
    url: item.url,
    title: item.title,
    visitCount: item.visitCount,
    lastVisitTime: item.lastVisitTime
  }));

  await syncHistory(clientId, formattedHistory);
  logToBackground('History synced successfully');
}

// Initialize event listeners if we're in a browser environment
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.alarms) {
  // Sync history when URL changes
  chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, _tab) => {
    if (changeInfo.url) {
      logToBackground(`Navigation to: ${changeInfo.url}`);
      await uploadHistory();
    }
  });

  // Sync history periodically (every 15 minutes)
  chrome.alarms.create('syncHistory', { periodInMinutes: 15 });
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'syncHistory') {
      await uploadHistory();
    }
  });
}
interface HistoryEntry {
  url: string;
  title?: string;
  timestamp: number;
  deviceId: string;
  deviceInfo: {
    platform: string;
    browser: string;
    version: string;
  };
}

let deviceId: string;

const getDeviceInfo = () => ({
  platform: navigator.platform,
  browser: 'Chrome',
  version: navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown'
});

const initDeviceId = async () => {
  const stored = await chrome.storage.local.get('deviceId');
  if (stored.deviceId) {
    deviceId = stored.deviceId;
  } else {
    deviceId = crypto.randomUUID();
    await chrome.storage.local.set({ deviceId });
  }
};

const storeHistoryEntry = async (entry: HistoryEntry) => {
  const key = `history_${entry.timestamp}`;
  await chrome.storage.local.set({ [key]: entry });
  
  // Sync to server
  try {
    const response = await fetch(`${process.env.API_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!response.ok) throw new Error('Failed to sync history');
  } catch (error) {
    console.error('Failed to sync history:', error);
    // Store failed sync attempts for retry
    const failedSyncs = await chrome.storage.local.get('failedSyncs') || { failedSyncs: [] };
    failedSyncs.failedSyncs.push(entry);
    await chrome.storage.local.set({ failedSyncs: failedSyncs.failedSyncs });
  }
};

// Initialize device ID
initDeviceId();

// Listen for navigation events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.title) {
    const entry: HistoryEntry = {
      url: changeInfo.url,
      title: tab.title,
      timestamp: Date.now(),
      deviceId,
      deviceInfo: getDeviceInfo()
    };
    await storeHistoryEntry(entry);
  }
});

// Retry failed syncs periodically
setInterval(async () => {
  const { failedSyncs = [] } = await chrome.storage.local.get('failedSyncs');
  if (failedSyncs.length === 0) return;

  const retryPromises = failedSyncs.map(async (entry: HistoryEntry) => {
    try {
      await fetch(`${process.env.API_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return true;
    } catch {
      return false;
    }
  });

  const results = await Promise.all(retryPromises);
  const remainingFailures = failedSyncs.filter((_: HistoryEntry, i: number) => !results[i]);
  await chrome.storage.local.set({ failedSyncs: remainingFailures });
}, 60000); // Retry every minute
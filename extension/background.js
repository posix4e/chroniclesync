async function getDeviceInfo() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = await chrome.storage.local.get('deviceId').then(result => {
    if (!result.deviceId) {
      const newDeviceId = 'device_' + Math.random().toString(36).substring(2);
      chrome.storage.local.set({ deviceId: newDeviceId });
      return newDeviceId;
    }
    return result.deviceId;
  });

  return {
    deviceId,
    platform,
    userAgent,
    timestamp: new Date().toISOString()
  };
}

async function syncHistory(url, title) {
  try {
    const config = await chrome.storage.sync.get(['apiEndpoint', 'clientId']);
    const deviceInfo = await getDeviceInfo();

    const historyData = {
      url,
      title,
      clientId: config.clientId,
      ...deviceInfo
    };

    const response = await fetch(`${config.apiEndpoint}/v1/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.debug('History synced:', historyData);
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    syncHistory(tab.url, tab.title);
  }
});
const defaultConfig = {
  apiEndpoint: 'https://api.chroniclesync.xyz',
  clientId: 'extension-default'
};

export async function getConfig() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    return defaultConfig;
  }

  try {
    const result = await chrome.storage.sync.get(['apiEndpoint', 'clientId']);
    return {
      apiEndpoint: result.apiEndpoint || defaultConfig.apiEndpoint,
      clientId: result.clientId || defaultConfig.clientId
    };
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
}

export async function syncHistory(url, title, timestamp) {
  try {
    const config = await getConfig();
    const response = await fetch(`${config.apiEndpoint}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId
      },
      body: JSON.stringify({
        url,
        title,
        timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.debug(`Successfully synced history for: ${url}`);
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

// Only add the listener if we're in a browser environment
if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      await syncHistory(
        tab.url,
        tab.title || '',
        new Date().toISOString()
      );
    }
  });
}
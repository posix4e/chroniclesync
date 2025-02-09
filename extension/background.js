// Clear logs on startup
chrome.storage.local.set({ logs: [] });

let clientId = null;
let environment = null;
let customApiUrl = null;

// Initialize settings from storage
async function initializeSettings() {
  const result = await chrome.storage.sync.get(['clientId', 'environment', 'customApiUrl']);
  clientId = result.clientId;
  environment = result.environment;
  customApiUrl = result.customApiUrl;
  console.debug('Initialized settings:', { clientId, environment, customApiUrl });
  await logToBackground(`Initialized settings: ${JSON.stringify({ clientId, environment, customApiUrl })}`);
}

// Initialize settings on startup
initializeSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync') {
    let settingsChanged = false;
    if (changes.clientId) {
      clientId = changes.clientId.newValue;
      console.debug('Client ID updated:', clientId);
      settingsChanged = true;
    }
    if (changes.environment) {
      environment = changes.environment.newValue;
      console.debug('Environment updated:', environment);
      settingsChanged = true;
    }
    if (changes.customApiUrl) {
      customApiUrl = changes.customApiUrl.newValue;
      console.debug('Custom API URL updated:', customApiUrl);
      settingsChanged = true;
    }
    if (settingsChanged) {
      await logToBackground(`Settings updated: ${JSON.stringify({ clientId, environment, customApiUrl })}`);
    }
  }
});

// Listen for runtime reload
chrome.runtime.onInstalled.addListener(async () => {
  console.debug('Extension reloaded');
  await initializeSettings();
  await logToBackground('Extension reloaded');
});

// Listen for runtime startup
chrome.runtime.onStartup.addListener(async () => {
  console.debug('Extension started');
  await initializeSettings();
  await logToBackground('Extension started');
});

// Listen for runtime suspend
chrome.runtime.onSuspend.addListener(async () => {
  console.debug('Extension suspended');
  await logToBackground('Extension suspended');
});

// Listen for runtime suspend cancel
chrome.runtime.onSuspendCanceled.addListener(async () => {
  console.debug('Extension suspend canceled');
  await logToBackground('Extension suspend canceled');
  await initializeSettings();
});

// Listen for runtime connect
chrome.runtime.onConnect.addListener(async (port) => {
  console.debug('Extension connected');
  await logToBackground('Extension connected');
  await initializeSettings();
});

// Listen for runtime message
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.debug('Extension message received:', message);
  await logToBackground(`Extension message received: ${JSON.stringify(message)}`);
  await initializeSettings();
  sendResponse({ success: true });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    const deviceInfo = getDeviceInfo();
    (async () => {
      await logToBackground(`Navigation to: ${changeInfo.url}`);
      try {
        if (!clientId) {
          await logToBackground('No client ID configured');
          return;
        }
        await syncHistory(changeInfo.url, deviceInfo);
        await logToBackground(`Successfully synced history for: ${changeInfo.url}`);
      } catch (error) {
        console.error('Error syncing history:', error);
        await logToBackground(`Error syncing history: ${error.message}`);
      }
    })();
  }
});

async function logToBackground(message) {
  console.debug(message);
  const { logs = [] } = await chrome.storage.local.get('logs');
  logs.push(message);
  await chrome.storage.local.set({ logs, lastLog: message });
  console.debug('Current logs:', logs);
}

const getDeviceInfo = () => {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = chrome.runtime.id;

  return {
    deviceId,
    platform,
    userAgent,
    browserName: 'Chrome',
    timestamp: new Date().toISOString()
  };
};

async function getApiUrl() {
  if (environment === 'custom' && customApiUrl) {
    return customApiUrl;
  }
  const baseUrl = environment === 'staging' ? 'https://api-staging.chroniclesync.xyz' : 'https://api.chroniclesync.xyz';
  console.debug('Using base URL:', baseUrl);
  return baseUrl;
}

async function syncHistory(url, deviceInfo) {
  try {
    if (!clientId) {
      console.debug('No client ID configured');
      await logToBackground('No client ID configured');
      return;
    }

    const baseUrl = await getApiUrl();
    console.debug('Using API URL:', baseUrl);

    const requestBody = {
      url,
      ...deviceInfo,
    };
    console.debug('Request body:', requestBody);

    const response = await fetch(`${baseUrl}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientId}`
      },
      body: JSON.stringify(requestBody)
    });

    console.debug('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to sync history: ${response.statusText} - ${errorText}`);
    }

    console.debug('Successfully synced history');
    await logToBackground(`Successfully synced history for: ${url}`);
  } catch (error) {
    console.error('Error in syncHistory:', error);
    await logToBackground(`Error syncing history: ${error.message}`);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    const deviceInfo = getDeviceInfo();
    (async () => {
      await logToBackground(`Navigation to: ${changeInfo.url}`);
      await syncHistory(changeInfo.url, deviceInfo);
    })();
  }
});
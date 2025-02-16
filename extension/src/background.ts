import { getConfig } from '../config.js';
import { createEncryptionManager } from './utils/encryption';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

interface EncryptionManager {
  encrypt(data: string): Promise<EncryptedData>;
}

let encryptionManager: EncryptionManager | null = null;

// Initialize extension
async function initializeExtension() {
  try {
    // Ensure storage is accessible
    await chrome.storage.local.get(['initialized']);

    // Load initial config
    const config = await getConfig();
    
    // Initialize encryption manager with client ID
    if (config.clientId && config.clientId !== 'extension-default') {
      encryptionManager = createEncryptionManager(config.clientId);
    }

    // Mark as initialized
    await chrome.storage.local.set({ initialized: true });

    return true;
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    return false;
  }
}

async function getSystemInfo() {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = await getDeviceId();

  return {
    deviceId,
    platform,
    userAgent,
    browserName: 'Chrome',
    browserVersion: /Chrome\/([0-9.]+)/.exec(userAgent)?.[1] || 'unknown'
  };
}

async function getDeviceId() {
  const result = await chrome.storage.local.get(['deviceId']);
  if (result.deviceId) {
    return result.deviceId;
  }
  const deviceId = 'device_' + Math.random().toString(36).substring(2);
  await chrome.storage.local.set({ deviceId });
  return deviceId;
}

interface HistoryItem {
  url: string;
  title?: string;
  visitTime: number;
  visitId: string;
  referringVisitId: string;
  transition: string;
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

async function encryptHistoryItem(item: HistoryItem) {
  if (!encryptionManager) {
    throw new Error('Encryption manager not initialized');
  }

  const encryptedUrl = await encryptionManager.encrypt(item.url);
  const encryptedTitle = item.title ? await encryptionManager.encrypt(item.title) : null;

  return {
    ...item,
    url: encryptedUrl,
    title: encryptedTitle,
    isEncrypted: true
  };
}

async function syncHistory(forceFullSync = false) {
  try {
    const initialized = await chrome.storage.local.get(['initialized']);
    if (!initialized.initialized) {
      const success = await initializeExtension();
      if (!success) {
        console.debug('Sync skipped: Extension not initialized');
        return;
      }
    }

    const config = await getConfig();

    // Skip sync if using default client ID
    if (!config.clientId || config.clientId === 'extension-default') {
      console.debug('Sync paused: No client ID configured');
      throw new Error('Please configure your Client ID in the extension popup');
    }

    // Ensure encryption manager is initialized
    if (!encryptionManager) {
      encryptionManager = createEncryptionManager(config.clientId);
    }

    console.debug('Starting sync with client ID:', config.clientId);

    const systemInfo = await getSystemInfo();
    const now = Date.now();

    // Get stored lastSync time
    const stored = await chrome.storage.local.get(['lastSync']);
    const storedLastSync = stored.lastSync || 0;

    // Use stored lastSync time unless forcing full sync
    const startTime = forceFullSync ? 0 : storedLastSync;

    // Get history since last sync
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      endTime: now,
      maxResults: 10000
    });

    if (historyItems.length === 0) {
      return;
    }

    // Get detailed visit information and encrypt sensitive data
    const historyData = await Promise.all(historyItems.map(async item => {
      if (!item.url) {
        return [];
      }

      const visits = await chrome.history.getVisits({ url: item.url });
      
      if (!visits) {
        return [];
      }

      const visitData = visits
        .filter((visit: chrome.history.VisitItem) => visit.visitTime && visit.visitTime >= startTime && visit.visitTime <= now)
        .map((visit: chrome.history.VisitItem) => ({
          url: item.url || '',
          title: item.title || '',
          visitTime: visit.visitTime || 0,
          visitId: visit.visitId || '',
          referringVisitId: visit.referringVisitId || '',
          transition: visit.transition || '',
          ...systemInfo
        }));

      // Encrypt each visit's sensitive data
      return Promise.all(visitData.map(encryptHistoryItem));
    }));

    const flattenedHistoryData = historyData.flat();

    if (flattenedHistoryData.length === 0) {
      return;
    }

    const response = await fetch(`${config.apiEndpoint}?clientId=${encodeURIComponent(config.clientId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: flattenedHistoryData,
        deviceInfo: systemInfo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const latestVisitTime = Math.max(...flattenedHistoryData.map((item: HistoryItem) => item.visitTime));
    
    const currentLastSync = (await chrome.storage.local.get(['lastSync'])).lastSync || 0;
    if (latestVisitTime > currentLastSync) {
      await chrome.storage.local.set({ lastSync: latestVisitTime });
    }

    try {
      chrome.runtime.sendMessage({ type: 'syncComplete' }).catch(() => {
        // Ignore error when no receivers are present
      });
    } catch {
      // Catch any other messaging errors
    }

    console.debug(`Successfully synced ${historyData.length} history items`);
  } catch (error) {
    console.error('Error syncing history:', error);
    return;
  }
}

// Initial sync with full history
syncHistory(true);

// Set up periodic sync
setInterval(() => syncHistory(false), SYNC_INTERVAL);

// Listen for navigation events
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, _tab) => {
  if (changeInfo.url) {
    console.debug(`Navigation to: ${changeInfo.url}`);
    setTimeout(() => syncHistory(false), 1000);
  }
});

// Listen for messages from the page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getClientId') {
    chrome.storage.local.get(['initialized']).then(async result => {
      if (!result.initialized) {
        const success = await initializeExtension();
        if (!success) {
          sendResponse({ error: 'Extension not initialized' });
          return;
        }
      }

      try {
        const config = await getConfig();
        sendResponse({ clientId: config.clientId === 'extension-default' ? null : config.clientId });
      } catch (error) {
        console.error('Error getting client ID:', error);
        sendResponse({ error: 'Failed to get client ID' });
      }
    });
    return true;
  } else if (request.type === 'triggerSync') {
    syncHistory(true)
      .then(() => {
        sendResponse({ success: true, message: 'Sync successful' });
        try {
          chrome.runtime.sendMessage({ type: 'syncComplete', success: true }).catch(() => {
            // Ignore error when no receivers are present
          });
        } catch {
          // Catch any other messaging errors
        }
      })
      .catch(error => {
        console.error('Manual sync failed:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});
// Device information
let deviceInfo = null;

// Initialize device info
async function initDeviceInfo() {
  if (!deviceInfo) {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    const id = await generateDeviceId();
    
    deviceInfo = {
      id,
      platform,
      userAgent,
      lastSync: Date.now(),
      name: `Chrome on ${platform}`
    };
    
    await chrome.storage.local.set({ deviceInfo });
  }
  return deviceInfo;
}

// Generate a unique device ID
async function generateDeviceId() {
  const existingInfo = await chrome.storage.local.get('deviceInfo');
  if (existingInfo.deviceInfo?.id) {
    return existingInfo.deviceInfo.id;
  }
  return 'device_' + Math.random().toString(36).substring(2, 15);
}

// Track history changes
chrome.history.onVisited.addListener(async (historyItem) => {
  const device = await initDeviceInfo();
  const historyEntry = {
    url: historyItem.url,
    title: historyItem.title,
    lastVisitTime: historyItem.lastVisitTime,
    deviceId: device.id,
    deviceName: device.name,
    timestamp: Date.now()
  };
  
  // Store locally first
  const key = `history_${historyEntry.timestamp}`;
  await chrome.storage.local.set({ [key]: historyEntry });
  
  // Sync to server
  try {
    const response = await fetch('https://api.chroniclesync.xyz/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyEntry)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to sync history:', error);
    // Store failed sync attempts for retry
    const failedSyncs = await chrome.storage.local.get('failedSyncs') || { failedSyncs: [] };
    failedSyncs.push(key);
    await chrome.storage.local.set({ failedSyncs });
  }
});

// Sync history from other devices periodically
async function syncHistory() {
  const device = await initDeviceInfo();
  try {
    const response = await fetch(`https://api.chroniclesync.xyz/history?since=${device.lastSync}&deviceId=${device.id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const remoteHistory = await response.json();
    
    // Update local storage with remote history
    for (const entry of remoteHistory) {
      const key = `history_${entry.timestamp}`;
      await chrome.storage.local.set({ [key]: entry });
    }
    
    // Update last sync time
    device.lastSync = Date.now();
    await chrome.storage.local.set({ deviceInfo: device });
    
  } catch (error) {
    console.error('Failed to fetch remote history:', error);
  }
}

// Retry failed syncs
async function retryFailedSyncs() {
  const { failedSyncs = [] } = await chrome.storage.local.get('failedSyncs');
  const remainingFailures = [];
  
  for (const key of failedSyncs) {
    const { [key]: historyEntry } = await chrome.storage.local.get(key);
    try {
      const response = await fetch('https://api.chroniclesync.xyz/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyEntry)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to retry sync:', error);
      remainingFailures.push(key);
    }
  }
  
  await chrome.storage.local.set({ failedSyncs: remainingFailures });
}

// Handle messages from content scripts
console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.type === 'GET_HISTORY') {
    console.log('Processing GET_HISTORY request');
    chrome.history.search({ text: '', maxResults: 10 }, (results) => {
      console.log('Got history results:', results);
      sendResponse(results);
    });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'GET_DEVICE_INFO') {
    console.log('Processing GET_DEVICE_INFO request');
    chrome.storage.local.get('deviceInfo', (result) => {
      console.log('Got device info:', result.deviceInfo);
      sendResponse(result.deviceInfo);
    });
    return true; // Will respond asynchronously
  }
});

// Initialize device and start sync processes
initDeviceInfo().then(() => {
  // Sync every 5 minutes
  setInterval(syncHistory, 5 * 60 * 1000);
  // Retry failed syncs every 10 minutes
  setInterval(retryFailedSyncs, 10 * 60 * 1000);
});
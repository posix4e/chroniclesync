import { api } from './utils/api';

// Initialize background script
// Initialization message is important for debugging
console.log('ChronicleSync background script initialized');

function getDeviceName(os: string): string {
  switch (os) {
  case 'mac':
    return 'MacOS Device';
  case 'win':
    return 'Windows Device';
  case 'linux':
    return 'Linux Device';
  default:
    return 'Unknown Device';
  }
}

interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastSync: number;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
  deviceInfo?: DeviceInfo;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_HISTORY') {
    syncHistory(request.deviceId).then(sendResponse);
    return true;
  }
});

async function getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
  const platform = await chrome.runtime.getPlatformInfo();
  const manifest = chrome.runtime.getManifest();
  
  return {
    id: deviceId,
    name: getDeviceName(platform.os),
    browser: `Chrome ${manifest.version}`,
    os: platform.os,
    lastSync: Date.now()
  };
}

async function syncHistory(deviceId: string): Promise<{ success: boolean; message: string; history?: HistoryItem[] }> {
  try {
    // Get device info
    const deviceInfo = await getDeviceInfo(deviceId);
    
    // Get local history
    const history = await chrome.history.search({
      text: '',
      maxResults: 100,
      startTime: Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    });

    const historyItems: HistoryItem[] = history.map(item => ({
      id: item.id || Math.random().toString(36).substring(2),
      url: item.url || '',
      title: item.title || '',
      visitTime: item.lastVisitTime || Date.now(),
      deviceId,
      deviceInfo
    }));

    // Send to server
    await api.post('/history/sync', { items: historyItems });

    // Get history from server
    const response = await api.get<{ items: HistoryItem[] }>('/history');
    const serverItems = response.data.items;

    // Add new items from other devices to local history
    const addPromises = serverItems
      .filter(item => item.deviceId !== deviceId)
      .map(item => chrome.history.addUrl({ url: item.url }));
    
    await Promise.all(addPromises);

    // Return all history items with device info
    const allItems = [...historyItems, ...serverItems.filter(item => item.deviceId !== deviceId)];
    
    return { 
      success: true, 
      message: 'History sync completed successfully',
      history: allItems
    };
  } catch (error) {
    console.error('History sync failed:', error);
    return { success: false, message: 'History sync failed: ' + (error as Error).message };
  }
}
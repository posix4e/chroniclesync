import { DB } from './utils/db';
import { DeviceInfo, getBrowserInfo, getDeviceName } from './utils/devices';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceInfo: DeviceInfo;
}

interface SyncData {
  history?: HistoryItem[];
  devices?: DeviceInfo[];
}

const db = new DB();
let initialized = false;
const HISTORY_LIMIT = 100;
const DEVICE_INACTIVE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

async function initializeDB() {
  if (!initialized) {
    const clientId = Math.random().toString(36).slice(2);
    await db.init(clientId);
    initialized = true;
  }
}

async function updateDeviceList(): Promise<DeviceInfo[]> {
  const data = await db.getData() as SyncData;
  const devices = data.devices || [];
  const { browser, os } = getBrowserInfo();
  const name = await getDeviceName();
  const now = Date.now();

  // Remove inactive devices
  const activeDevices = devices.filter(d => 
    now - d.lastSeen < DEVICE_INACTIVE_THRESHOLD
  );

  // Update or add current device
  const existingDevice = activeDevices.find(d => d.id === db.clientId);
  if (existingDevice) {
    existingDevice.name = name;
    existingDevice.lastSeen = now;
  } else {
    activeDevices.push({
      id: db.clientId,
      name,
      browser,
      os,
      lastSeen: now
    });
  }

  return activeDevices;
}

async function syncHistory(url: string, title: string) {
  try {
    await initializeDB();
    const data = await db.getData() as SyncData;
    const history = data.history || [];
    const { browser, os } = getBrowserInfo();
    const name = await getDeviceName();

    // Update device list
    const devices = await updateDeviceList();

    // Add new history item
    const newItem: HistoryItem = {
      id: Math.random().toString(36).slice(2),
      url,
      title,
      visitTime: Date.now(),
      deviceInfo: {
        id: db.clientId,
        name,
        browser,
        os,
        lastSeen: Date.now()
      }
    };

    // Check for duplicates within last hour
    const lastHour = Date.now() - 60 * 60 * 1000;
    const recentDuplicate = history.find(item => 
      item.url === url && 
      item.deviceInfo.id === db.clientId &&
      item.visitTime > lastHour
    );

    if (!recentDuplicate) {
      history.unshift(newItem);
      
      // Keep only last N items
      if (history.length > HISTORY_LIMIT) {
        history.pop();
      }
    }

    await db.setData({ ...data, history, devices });
  } catch {
    // Error handling is done by the component
  }
}

// Update device list periodically
setInterval(async () => {
  if (initialized) {
    try {
      const devices = await updateDeviceList();
      const data = await db.getData() as SyncData;
      await db.setData({ ...data, devices });
    } catch {
      // Error handling is done by the component
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.title) {
    syncHistory(changeInfo.url, tab.title);
  }
});
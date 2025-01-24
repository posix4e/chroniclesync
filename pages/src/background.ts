import { DB } from './utils/db';

const db = new DB();
let initialized = false;

async function getDeviceInfo() {
  const { deviceName } = await chrome.storage.sync.get('deviceName');
  const userAgent = navigator.userAgent;
  const browser = userAgent.includes('Chrome') ? 'Chrome' : 'Unknown';
  const os = userAgent.includes('Windows') ? 'Windows' :
    userAgent.includes('Mac') ? 'macOS' :
      userAgent.includes('Linux') ? 'Linux' : 'Unknown';

  return {
    name: deviceName || `Device_${Math.random().toString(36).slice(2, 7)}`,
    browser,
    os
  };
}

async function initializeDB() {
  if (!initialized) {
    const clientId = Math.random().toString(36).slice(2);
    await db.init(clientId);
    initialized = true;
  }
}

async function syncHistory(url: string, title: string) {
  try {
    await initializeDB();
    const deviceInfo = await getDeviceInfo();
    const data = await db.getData();
    const history = (data.history || []) as Array<{
      id: string;
      url: string;
      title: string;
      visitTime: number;
      deviceInfo: {
        name: string;
        browser: string;
        os: string;
      };
    }>;

    history.unshift({
      id: Math.random().toString(36).slice(2),
      url,
      title,
      visitTime: Date.now(),
      deviceInfo
    });

    // Keep only last 100 items
    if (history.length > 100) {
      history.pop();
    }

    await db.setData({ ...data, history });
  } catch (error) {
    // Log error for debugging in extension
    console.log('Error syncing history:', error);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.title) {
    syncHistory(changeInfo.url, tab.title);
  }
});
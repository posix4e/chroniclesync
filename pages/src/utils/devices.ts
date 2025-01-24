export interface DeviceInfo {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastSeen: number;
}

export function getBrowserInfo(): { browser: string; os: string } {
  const userAgent = navigator.userAgent;
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
    userAgent.includes('Firefox') ? 'Firefox' :
    userAgent.includes('Safari') ? 'Safari' : 'Unknown';

  const os = userAgent.includes('Windows') ? 'Windows' :
    userAgent.includes('Mac') ? 'macOS' :
    userAgent.includes('Linux') ? 'Linux' : 'Unknown';

  return { browser, os };
}

export async function getDeviceName(): Promise<string> {
  try {
    const { deviceName } = await chrome.storage.sync.get('deviceName');
    if (deviceName) {
      return deviceName;
    }
    const defaultName = `Device_${Math.random().toString(36).slice(2, 7)}`;
    await chrome.storage.sync.set({ deviceName: defaultName });
    return defaultName;
  } catch (error) {
    // Return a random name if storage fails
    return `Device_${Math.random().toString(36).slice(2, 7)}`;
  }
}

export async function updateDeviceName(name: string): Promise<void> {
  await chrome.storage.sync.set({ deviceName: name });
}
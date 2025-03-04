import { DeviceInfo } from '../types';

export async function getDeviceId(): Promise<string> {
  const result = await chrome.storage.local.get(['deviceId']);
  if (result.deviceId) {
    return result.deviceId;
  }
  const deviceId = 'device_' + Math.random().toString(36).substring(2);
  await chrome.storage.local.set({ deviceId });
  return deviceId;
}

export async function getSystemInfo(): Promise<DeviceInfo> {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  const deviceId = await getDeviceId();
  const browserName = 'Chrome';
  const browserVersion = /Chrome\/([0-9.]+)/.exec(userAgent)?.[1] || 'unknown';

  return {
    deviceId,
    platform,
    userAgent,
    browserName,
    browserVersion
  };
}
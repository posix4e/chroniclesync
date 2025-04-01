import { DeviceInfo } from '../models/types';

// Platform detection utility
export function getPlatform(): string {
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf('iphone') !== -1 || userAgent.indexOf('ipad') !== -1 || userAgent.indexOf('ipod') !== -1) {
      return 'ios';
    } else if (userAgent.indexOf('android') !== -1) {
      return 'android';
    } else if (userAgent.indexOf('windows') !== -1) {
      return 'windows';
    } else if (userAgent.indexOf('mac') !== -1) {
      return 'macos';
    } else if (userAgent.indexOf('linux') !== -1) {
      return 'linux';
    }
  }
  
  return 'unknown';
}

// Browser detection utility
export function getBrowser(): { name: string, version: string } {
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent;
    
    // Safari
    const safariMatch = userAgent.match(/Version\/([0-9._]+).*Safari/);
    if (safariMatch) {
      return { name: 'safari', version: safariMatch[1] };
    }
    
    // Chrome
    const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
    if (chromeMatch) {
      return { name: 'chrome', version: chromeMatch[1] };
    }
    
    // Firefox
    const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/);
    if (firefoxMatch) {
      return { name: 'firefox', version: firefoxMatch[1] };
    }
    
    // Edge
    const edgeMatch = userAgent.match(/Edg\/([0-9.]+)/);
    if (edgeMatch) {
      return { name: 'edge', version: edgeMatch[1] };
    }
  }
  
  return { name: 'unknown', version: '0.0' };
}

// Generate a unique device ID
export function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get system information
export function getSystemInfo(): DeviceInfo {
  const browser = getBrowser();
  const platform = getPlatform();
  const deviceId = generateDeviceId();
  
  return {
    deviceId,
    platform,
    userAgent: navigator.userAgent,
    browserName: browser.name,
    browserVersion: browser.version
  };
}
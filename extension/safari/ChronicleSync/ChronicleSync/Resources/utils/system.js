// Utility functions for system information

// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

// Get system information
export async function getSystemInfo() {
  try {
    // Generate a unique device ID if not already stored
    let deviceId = await getDeviceId();
    
    // Get browser information
    const browserInfo = await getBrowserInfo();
    
    // Get platform information
    const platformInfo = getPlatformInfo();
    
    return {
      deviceId,
      name: platformInfo.name,
      type: platformInfo.type,
      os: platformInfo.os,
      browser: browserInfo.name,
      browserVersion: browserInfo.version
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    
    // Return basic info if there's an error
    return {
      deviceId: 'unknown-device',
      name: 'Unknown Device',
      type: 'unknown',
      os: 'unknown',
      browser: isSafari ? 'Safari' : 'Chrome',
      browserVersion: 'unknown'
    };
  }
}

// Get or generate a device ID
async function getDeviceId() {
  try {
    const data = await browserAPI.storage.local.get(['deviceId']);
    
    if (data.deviceId) {
      return data.deviceId;
    }
    
    // Generate a new device ID
    const deviceId = generateDeviceId();
    
    // Store it for future use
    await browserAPI.storage.local.set({ deviceId });
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateDeviceId();
  }
}

// Generate a random device ID
function generateDeviceId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'device-';
  
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

// Get browser information
async function getBrowserInfo() {
  if (isSafari) {
    try {
      const info = await browserAPI.runtime.getBrowserInfo();
      return {
        name: info.name || 'Safari',
        version: info.version || 'unknown'
      };
    } catch (error) {
      return {
        name: 'Safari',
        version: 'unknown'
      };
    }
  } else {
    // Chrome doesn't have a direct API for this
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(chrome|chromium|crios)\\/([0-9.]+)/i);
    
    return {
      name: 'Chrome',
      version: match ? match[2] : 'unknown'
    };
  }
}

// Get platform information
function getPlatformInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Detect OS
  let os = 'unknown';
  let type = 'desktop';
  let name = 'Unknown Device';
  
  if (userAgent.includes('mac os')) {
    os = 'macOS';
    name = 'Mac';
  } else if (userAgent.includes('iphone')) {
    os = 'iOS';
    type = 'mobile';
    name = 'iPhone';
  } else if (userAgent.includes('ipad')) {
    os = 'iPadOS';
    type = 'tablet';
    name = 'iPad';
  } else if (userAgent.includes('android')) {
    os = 'Android';
    type = userAgent.includes('mobile') ? 'mobile' : 'tablet';
    name = type === 'mobile' ? 'Android Phone' : 'Android Tablet';
  } else if (userAgent.includes('windows')) {
    os = 'Windows';
    name = 'Windows PC';
  } else if (userAgent.includes('linux')) {
    os = 'Linux';
    name = 'Linux PC';
  }
  
  return { os, type, name };
}
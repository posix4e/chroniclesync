// Get system information for device identification
export async function getSystemInfo() {
  // Try to get device info from native app first
  try {
    const nativeInfo = await getNativeDeviceInfo();
    if (nativeInfo && nativeInfo.success && nativeInfo.data) {
      const { deviceId, platform, model, osVersion } = nativeInfo.data;
      
      return {
        deviceId,
        platform,
        model,
        osVersion,
        userAgent: navigator.userAgent,
        language: navigator.language,
        browser: 'Safari iOS',
        lastSeen: Date.now()
      };
    }
  } catch (error) {
    console.warn('Failed to get device info from native app:', error);
    // Fall back to browser-based info
  }
  
  // Browser-based fallback
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  
  // Generate a unique device ID if not already stored
  let deviceId = '';
  try {
    const stored = await browser.storage.local.get(['deviceId']);
    if (stored.deviceId) {
      deviceId = stored.deviceId;
    } else {
      deviceId = generateDeviceId();
      await browser.storage.local.set({ deviceId });
    }
  } catch (error) {
    console.error('Error with device ID:', error);
    deviceId = generateDeviceId();
  }
  
  return {
    deviceId,
    userAgent,
    platform,
    language,
    browser: 'Safari iOS',
    lastSeen: Date.now()
  };
}

// Try to get device info from the native app
async function getNativeDeviceInfo() {
  return new Promise((resolve, reject) => {
    try {
      browser.runtime.sendNativeMessage(
        { type: "getDeviceInfo" },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Generate a random device ID
function generateDeviceId() {
  return 'safari-ios-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
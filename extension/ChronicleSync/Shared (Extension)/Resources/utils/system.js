// Get system information for device identification
export async function getSystemInfo() {
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
    browser: 'Safari',
    lastSeen: Date.now()
  };
}

// Generate a random device ID
function generateDeviceId() {
  return 'safari-' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
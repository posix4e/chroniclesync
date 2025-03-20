// Configuration for ChronicleSync
let config = {
  clientId: 'extension-default',
  apiEndpoint: 'https://api.chroniclesync.xyz/sync',
  extractContent: true,
  syncInterval: 5, // minutes
  useNativeStorage: true // Try to use native storage when available
};

// Try to load config from native storage
async function loadFromNative() {
  return new Promise((resolve, reject) => {
    try {
      browser.runtime.sendNativeMessage(
        { type: 'loadFromNative', key: 'chroniclesync_config' },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else if (response && response.success && response.data && response.data.value) {
            resolve(response.data.value);
          } else {
            reject(new Error('No config found in native storage'));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Try to save config to native storage
async function saveToNative(configData) {
  return new Promise((resolve, reject) => {
    try {
      browser.runtime.sendNativeMessage(
        { 
          type: 'saveToNative', 
          data: { 
            key: 'chroniclesync_config', 
            value: configData 
          } 
        },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else if (response && response.success) {
            resolve(true);
          } else {
            reject(new Error(response?.message || 'Failed to save to native storage'));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

export async function getConfig() {
  try {
    // Try native storage first if enabled
    if (config.useNativeStorage) {
      try {
        const nativeConfig = await loadFromNative();
        if (nativeConfig) {
          config = { ...config, ...nativeConfig };
          return config;
        }
      } catch (error) {
        console.warn('Failed to load from native storage, falling back to browser storage:', error);
      }
    }
    
    // Fall back to browser storage
    const stored = await browser.storage.local.get(['config']);
    if (stored.config) {
      config = { ...config, ...stored.config };
    }
    return config;
  } catch (error) {
    console.error('Error loading config:', error);
    return config;
  }
}

export async function saveConfig(newConfig) {
  try {
    config = { ...config, ...newConfig };
    
    // Try to save to native storage if enabled
    if (config.useNativeStorage) {
      try {
        await saveToNative(config);
        console.log('Config saved to native storage');
        return true;
      } catch (error) {
        console.warn('Failed to save to native storage, falling back to browser storage:', error);
      }
    }
    
    // Fall back to browser storage
    await browser.storage.local.set({ config });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}
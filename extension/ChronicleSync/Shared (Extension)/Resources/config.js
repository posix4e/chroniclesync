// Configuration for ChronicleSync
let config = {
  clientId: 'extension-default',
  apiEndpoint: 'https://api.chroniclesync.xyz/sync',
  extractContent: true,
  syncInterval: 5 // minutes
};

export async function getConfig() {
  try {
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
    await browser.storage.local.set({ config });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}
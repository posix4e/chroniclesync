const defaultConfig = {
  apiEndpoint: 'https://api.chroniclesync.xyz',  // Worker API endpoint
  pagesUrl: 'https://chroniclesync.pages.dev',   // Pages UI endpoint
  clientId: 'extension-default'
};

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(['apiEndpoint', 'pagesUrl', 'clientId']);
    return {
      apiEndpoint: result.apiEndpoint || defaultConfig.apiEndpoint,
      pagesUrl: result.pagesUrl || defaultConfig.pagesUrl,
      clientId: result.clientId || defaultConfig.clientId
    };
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
}

// Save configuration to storage
async function saveConfig(config) {
  try {
    await chrome.storage.sync.set({
      apiEndpoint: config.apiEndpoint,
      pagesUrl: config.pagesUrl,
      clientId: config.clientId
    });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export { getConfig, saveConfig, defaultConfig };
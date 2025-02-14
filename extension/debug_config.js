const defaultConfig = {
  apiEndpoint: 'http://localhost:54057',  // Local debug server
  pagesUrl: 'http://localhost:54057',   
  clientId: 'extension-default'
};

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(['apiEndpoint', 'pagesUrl', 'clientId', 'environment', 'customApiUrl']);
    
    // Always use local debug server
    const apiEndpoint = 'http://localhost:54057';

    return {
      apiEndpoint: apiEndpoint,
      pagesUrl: apiEndpoint,
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
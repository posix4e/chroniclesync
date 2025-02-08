const defaultConfig = {
  apiUrl: 'https://api.chroniclesync.xyz',  // Worker API endpoint
  pagesUrl: 'https://chroniclesync.pages.dev',   // Pages UI endpoint
  clientId: ''  // Empty by default to force user configuration
};

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(['apiUrl', 'pagesUrl', 'clientId']);
    return {
      apiUrl: result.apiUrl || defaultConfig.apiUrl,
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
    const newConfig = {
      apiUrl: config.apiUrl?.trim(),
      pagesUrl: config.pagesUrl?.trim(),
      clientId: config.clientId?.trim()
    };

    // Validate required fields
    if (!newConfig.clientId) {
      throw new Error('Client ID is required');
    }

    if (!newConfig.apiUrl || !isValidUrl(newConfig.apiUrl)) {
      throw new Error('Invalid API URL');
    }

    if (!newConfig.pagesUrl || !isValidUrl(newConfig.pagesUrl)) {
      throw new Error('Invalid Pages URL');
    }

    await chrome.storage.sync.set(newConfig);
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export { getConfig, saveConfig, defaultConfig };
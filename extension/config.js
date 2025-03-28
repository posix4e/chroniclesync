import { urls, DEFAULT_CLIENT_ID, ENVIRONMENTS, STORAGE_KEYS } from '../shared/constants';

const defaultConfig = {
  apiEndpoint: urls.production.apiEndpoint,  // Worker API endpoint
  pagesUrl: urls.production.pagesUrl,        // Pages UI endpoint
  clientId: DEFAULT_CLIENT_ID
};

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get([
      STORAGE_KEYS.API_ENDPOINT, 
      STORAGE_KEYS.PAGES_URL, 
      STORAGE_KEYS.CLIENT_ID, 
      STORAGE_KEYS.ENVIRONMENT, 
      STORAGE_KEYS.CUSTOM_API_URL
    ]);
    
    // Determine API endpoint based on environment
    let apiEndpoint = defaultConfig.apiEndpoint;
    if (result[STORAGE_KEYS.ENVIRONMENT] === ENVIRONMENTS.STAGING) {
      apiEndpoint = urls.staging.apiEndpoint;
    } else if (result[STORAGE_KEYS.ENVIRONMENT] === ENVIRONMENTS.CUSTOM && result[STORAGE_KEYS.CUSTOM_API_URL]) {
      apiEndpoint = result[STORAGE_KEYS.CUSTOM_API_URL];
    }

    return {
      apiEndpoint: apiEndpoint,
      pagesUrl: result[STORAGE_KEYS.PAGES_URL] || defaultConfig.pagesUrl,
      clientId: result[STORAGE_KEYS.CLIENT_ID] || defaultConfig.clientId
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
      [STORAGE_KEYS.API_ENDPOINT]: config.apiEndpoint,
      [STORAGE_KEYS.PAGES_URL]: config.pagesUrl,
      [STORAGE_KEYS.CLIENT_ID]: config.clientId
    });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export { getConfig, saveConfig, defaultConfig };
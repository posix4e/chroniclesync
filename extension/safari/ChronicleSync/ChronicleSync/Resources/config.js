// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

// Default configuration
const DEFAULT_CONFIG = {
  clientId: 'extension-default',
  environment: 'production',
  customApiUrl: '',
  expirationDays: 7,
  apiEndpoint: 'https://api.chroniclesync.xyz/sync'
};

// Get the current configuration
export async function getConfig() {
  try {
    const result = await browserAPI.storage.local.get(['config']);
    const config = result.config || {};
    
    // Merge with defaults for any missing properties
    return {
      ...DEFAULT_CONFIG,
      ...config,
      // Compute the API endpoint based on environment
      apiEndpoint: getApiEndpoint(config.environment || DEFAULT_CONFIG.environment, config.customApiUrl)
    };
  } catch (error) {
    console.error('Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

// Save configuration
export async function saveConfig(config) {
  try {
    await browserAPI.storage.local.set({ config });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// Reset configuration to defaults
export async function resetConfig() {
  try {
    await browserAPI.storage.local.set({ config: DEFAULT_CONFIG });
    return true;
  } catch (error) {
    console.error('Error resetting config:', error);
    return false;
  }
}

// Get API endpoint based on environment
function getApiEndpoint(environment, customUrl) {
  switch (environment) {
    case 'production':
      return 'https://api.chroniclesync.xyz/sync';
    case 'staging':
      return 'https://api-staging.chroniclesync.xyz/sync';
    case 'custom':
      return customUrl || DEFAULT_CONFIG.apiEndpoint;
    default:
      return DEFAULT_CONFIG.apiEndpoint;
  }
}
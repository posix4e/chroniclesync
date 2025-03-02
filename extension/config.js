const defaultConfig = {
  apiEndpoint: 'https://api.chroniclesync.xyz',  // Worker API endpoint
  pagesUrl: 'https://chroniclesync.pages.dev',   // Pages UI endpoint
  clientId: 'extension-default',
  enableSummarization: false,
  summaryModel: 'Xenova/distilbart-cnn-6-6',
  maxLength: 150,
  minLength: 30
};

const STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get([
      'apiEndpoint', 
      'pagesUrl', 
      'clientId', 
      'environment', 
      'customApiUrl',
      'enableSummarization',
      'summaryModel',
      'maxLength',
      'minLength'
    ]);
    
    // Determine API endpoint based on environment
    let apiEndpoint = defaultConfig.apiEndpoint;
    if (result.environment === 'staging') {
      apiEndpoint = STAGING_API_URL;
    } else if (result.environment === 'custom' && result.customApiUrl) {
      apiEndpoint = result.customApiUrl;
    }

    return {
      apiEndpoint: apiEndpoint,
      pagesUrl: result.pagesUrl || defaultConfig.pagesUrl,
      clientId: result.clientId || defaultConfig.clientId,
      enableSummarization: result.enableSummarization !== undefined ? result.enableSummarization : defaultConfig.enableSummarization,
      summaryModel: result.summaryModel || defaultConfig.summaryModel,
      maxLength: result.maxLength !== undefined ? result.maxLength : defaultConfig.maxLength,
      minLength: result.minLength !== undefined ? result.minLength : defaultConfig.minLength
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
      clientId: config.clientId,
      enableSummarization: config.enableSummarization,
      summaryModel: config.summaryModel,
      maxLength: config.maxLength,
      minLength: config.minLength
    });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export { getConfig, saveConfig, defaultConfig };
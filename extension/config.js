const defaultConfig = {
  apiEndpoint: 'https://api.chroniclesync.xyz',  // Worker API endpoint
  pagesUrl: 'https://chroniclesync.pages.dev',   // Pages UI endpoint
  clientId: 'extension-default',
  summary: {
    enabled: true,
    autoSummarize: true,
    summaryLength: 30,
    minSentences: 3,
    maxSentences: 10,
    contentPriority: {
      headlines: true,
      lists: true,
      quotes: false
    },
    modelConfig: {
      modelUrl: 'https://tfhub.dev/tensorflow/tfjs-model/universal-sentence-encoder-lite/1/default/1',
      inputLength: 512,
      outputLength: 512,
      threshold: 0.3
    }
  }
};

const STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

// Load configuration from storage or use defaults
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(['apiEndpoint', 'pagesUrl', 'clientId', 'environment', 'customApiUrl', 'summary']);
    
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
      summary: result.summary || defaultConfig.summary
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
      summary: config.summary
    });
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

export { getConfig, saveConfig, defaultConfig };
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path configuration for build and testing
export const paths = {
  extensionDist: resolve(__dirname, '../dist'),
  popup: resolve(__dirname, '../popup.html'),
  background: resolve(__dirname, '../src/background.ts'),
  extension: resolve(__dirname, '../dist')
};

interface Config {
  apiEndpoint: string;
  pagesUrl: string;
  clientId: string;
}

const defaultConfig: Config = {
  apiEndpoint: 'https://api.chroniclesync.xyz',  // Worker API endpoint
  pagesUrl: 'https://chroniclesync.pages.dev',   // Pages UI endpoint
  clientId: 'extension-default'
};

const STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

// Load configuration from storage or use defaults
export async function getConfig(): Promise<Config> {
  try {
    const result = await chrome.storage.sync.get(['apiEndpoint', 'pagesUrl', 'clientId', 'environment', 'customApiUrl']);
    
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
      clientId: result.clientId || defaultConfig.clientId
    };
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
}

// Save configuration to storage
export async function saveConfig(config: Partial<Config>): Promise<boolean> {
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

export { defaultConfig };
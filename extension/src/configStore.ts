interface Config {
  apiEndpoint: string;
  pagesEndpoint: string;
}

const defaultConfig: Config = {
  apiEndpoint: 'https://api.chroniclesync.xyz',
  pagesEndpoint: 'https://chroniclesync.xyz'
};

export async function getConfig(): Promise<Config> {
  try {
    const result = await chrome.storage.local.get('config');
    return result.config || defaultConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
}

export async function setConfig(config: Partial<Config>): Promise<void> {
  try {
    const currentConfig = await getConfig();
    const newConfig = { ...currentConfig, ...config };
    await chrome.storage.local.set({ config: newConfig });
  } catch (error) {
    console.error('Error saving config:', error);
  }
}
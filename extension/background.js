// Initialize history manager with default config
let historyManager = null;

// Simple logging utility that doesn't use console
const logger = {
  warn: (message) => {
    chrome.runtime.sendMessage({ type: 'log', level: 'warn', message });
  },
  info: (message) => {
    chrome.runtime.sendMessage({ type: 'log', level: 'info', message });
  },
  error: (message, error) => {
    chrome.runtime.sendMessage({ 
      type: 'log', 
      level: 'error', 
      message,
      error: error?.toString()
    });
  }
};

// Load config from storage and initialize history manager
async function initializeHistoryManager() {
  const { clientId, environment } = await chrome.storage.local.get(['clientId', 'environment']);
  if (!clientId) {
    logger.warn('Client ID not configured');
    return;
  }

  const apiUrl = environment === 'staging' 
    ? 'https://api-staging.chroniclesync.xyz'
    : 'https://api.chroniclesync.xyz';

  const config = {
    clientId,
    syncInterval: 5000, // 5 seconds
    maxRetries: 3,
    apiUrl
  };

  try {
    historyManager = await import('./src/history/HistoryManager.js')
      .then(module => module.HistoryManager.getInstance(config));
    logger.info('History manager initialized with config: ' + JSON.stringify(config));
  } catch (error) {
    logger.error('Failed to initialize history manager', error);
  }
}

// Listen for config changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.clientId || changes.environment)) {
    initializeHistoryManager();
  }
});

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
  initializeHistoryManager();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  initializeHistoryManager();
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getHistoryStatus') {
    const status = historyManager?.getSyncStatus() || { status: 'not_initialized' };
    sendResponse(status);
    return true;
  }
  
  if (request.type === 'forceSync') {
    if (historyManager) {
      historyManager.forceSyncHistory()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    sendResponse({ success: false, error: 'History manager not initialized' });
    return true;
  }
});

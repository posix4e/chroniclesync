// Safari iOS Extension Settings Script

document.addEventListener('DOMContentLoaded', async () => {
  const clientIdInput = document.getElementById('clientId');
  const generateMnemonicButton = document.getElementById('generateMnemonic');
  const environmentSelect = document.getElementById('environment');
  const customApiUrlContainer = document.getElementById('customApiUrlContainer');
  const customApiUrlInput = document.getElementById('customApiUrl');
  const syncIntervalInput = document.getElementById('syncInterval');
  const syncOnStartupCheckbox = document.getElementById('syncOnStartup');
  const syncOnNavigationCheckbox = document.getElementById('syncOnNavigation');
  const saveSettingsButton = document.getElementById('saveSettings');
  const resetSettingsButton = document.getElementById('resetSettings');
  const statusMessageElement = document.getElementById('statusMessage');

  // Default configuration
  const DEFAULT_CONFIG = {
    clientId: '',
    apiEndpoint: 'https://api.chroniclesync.xyz/sync',
    environment: 'production',
    customApiUrl: '',
    syncInterval: 5,
    syncOnStartup: true,
    syncOnNavigation: true
  };

  // Load settings
  await loadSettings();

  // Add event listeners
  environmentSelect.addEventListener('change', toggleCustomApiUrl);
  generateMnemonicButton.addEventListener('click', generateMnemonic);
  saveSettingsButton.addEventListener('click', saveSettings);
  resetSettingsButton.addEventListener('click', resetSettings);

  // Toggle custom API URL input based on environment selection
  function toggleCustomApiUrl() {
    if (environmentSelect.value === 'custom') {
      customApiUrlContainer.classList.remove('hidden');
    } else {
      customApiUrlContainer.classList.add('hidden');
    }
  }

  // Generate a mnemonic phrase for client ID
  function generateMnemonic() {
    // Simple word list for demo purposes
    const words = [
      'apple', 'banana', 'cherry', 'date', 'elderberry',
      'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
      'mango', 'nectarine', 'orange', 'papaya', 'quince',
      'raspberry', 'strawberry', 'tangerine', 'watermelon'
    ];
    
    // Generate a 3-word mnemonic
    const mnemonic = Array(3).fill(0).map(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      return words[randomIndex];
    }).join('-');
    
    clientIdInput.value = mnemonic;
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const stored = await browser.storage.local.get(['config']);
      const config = stored.config || DEFAULT_CONFIG;
      
      clientIdInput.value = config.clientId || '';
      
      if (config.environment === 'production') {
        environmentSelect.value = 'production';
        customApiUrlContainer.classList.add('hidden');
      } else if (config.environment === 'staging') {
        environmentSelect.value = 'staging';
        customApiUrlContainer.classList.add('hidden');
      } else {
        environmentSelect.value = 'custom';
        customApiUrlContainer.classList.remove('hidden');
        customApiUrlInput.value = config.customApiUrl || '';
      }
      
      syncIntervalInput.value = config.syncInterval || 5;
      syncOnStartupCheckbox.checked = config.syncOnStartup !== false;
      syncOnNavigationCheckbox.checked = config.syncOnNavigation !== false;
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatusMessage('Error loading settings', false);
    }
  }

  // Save settings to storage
  async function saveSettings() {
    try {
      const clientId = clientIdInput.value.trim();
      const environment = environmentSelect.value;
      const customApiUrl = customApiUrlInput.value.trim();
      const syncInterval = parseInt(syncIntervalInput.value, 10) || 5;
      const syncOnStartup = syncOnStartupCheckbox.checked;
      const syncOnNavigation = syncOnNavigationCheckbox.checked;
      
      let apiEndpoint;
      if (environment === 'production') {
        apiEndpoint = 'https://api.chroniclesync.xyz/sync';
      } else if (environment === 'staging') {
        apiEndpoint = 'https://api-staging.chroniclesync.xyz/sync';
      } else {
        apiEndpoint = customApiUrl;
      }
      
      const config = {
        clientId,
        apiEndpoint,
        environment,
        customApiUrl,
        syncInterval,
        syncOnStartup,
        syncOnNavigation
      };
      
      await browser.storage.local.set({ config });
      showStatusMessage('Settings saved successfully', true);
      
      // Trigger a sync with the new settings
      browser.runtime.sendMessage({ type: 'triggerSync' });
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatusMessage('Error saving settings', false);
    }
  }

  // Reset settings to defaults
  async function resetSettings() {
    try {
      await browser.storage.local.set({ config: DEFAULT_CONFIG });
      await loadSettings();
      showStatusMessage('Settings reset to defaults', true);
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatusMessage('Error resetting settings', false);
    }
  }

  // Show status message
  function showStatusMessage(message, isSuccess) {
    statusMessageElement.textContent = message;
    statusMessageElement.classList.remove('hidden', 'success', 'error');
    statusMessageElement.classList.add(isSuccess ? 'success' : 'error');
    
    // Hide message after 3 seconds
    setTimeout(() => {
      statusMessageElement.classList.add('hidden');
    }, 3000);
  }
});
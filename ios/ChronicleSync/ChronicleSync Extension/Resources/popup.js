// Safari WebExtension popup script

document.addEventListener('DOMContentLoaded', async () => {
  const connectionStatus = document.getElementById('connection-status');
  const syncButton = document.getElementById('sync-button');
  const syncStatus = document.getElementById('sync-status');
  const lastSync = document.getElementById('last-sync');
  const entriesSynced = document.getElementById('entries-synced');
  const connectedDevices = document.getElementById('connected-devices');
  const apiKeyContainer = document.getElementById('api-key-container');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyButton = document.getElementById('save-api-key');
  const settingsLink = document.getElementById('settings-link');
  const syncContainer = document.getElementById('sync-container');
  
  // Check if API key is set
  const { apiKey } = await browser.storage.local.get('apiKey');
  
  if (!apiKey) {
    connectionStatus.textContent = 'Not Connected';
    connectionStatus.classList.add('disconnected');
    syncContainer.style.display = 'none';
    apiKeyContainer.style.display = 'block';
  } else {
    connectionStatus.textContent = 'Connected';
    connectionStatus.classList.add('connected');
    syncContainer.style.display = 'block';
    apiKeyContainer.style.display = 'none';
    
    // Load sync stats
    loadSyncStats();
  }
  
  // Handle sync button click
  syncButton.addEventListener('click', async () => {
    try {
      syncButton.disabled = true;
      syncStatus.textContent = 'Syncing...';
      
      const response = await browser.runtime.sendMessage({ action: 'syncNow' });
      
      if (response.success) {
        syncStatus.textContent = 'Sync completed successfully!';
        loadSyncStats();
      } else {
        syncStatus.textContent = `Sync failed: ${response.error}`;
      }
    } catch (error) {
      syncStatus.textContent = `Sync failed: ${error.message}`;
    } finally {
      syncButton.disabled = false;
      setTimeout(() => {
        syncStatus.textContent = '';
      }, 3000);
    }
  });
  
  // Handle save API key button click
  saveApiKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      alert('Please enter a valid API key');
      return;
    }
    
    try {
      await browser.storage.local.set({ apiKey });
      connectionStatus.textContent = 'Connected';
      connectionStatus.classList.remove('disconnected');
      connectionStatus.classList.add('connected');
      syncContainer.style.display = 'block';
      apiKeyContainer.style.display = 'none';
      
      // Trigger initial sync
      browser.runtime.sendMessage({ action: 'syncNow' });
    } catch (error) {
      alert(`Failed to save API key: ${error.message}`);
    }
  });
  
  // Handle settings link click
  settingsLink.addEventListener('click', (event) => {
    event.preventDefault();
    
    if (apiKeyContainer.style.display === 'none') {
      syncContainer.style.display = 'none';
      apiKeyContainer.style.display = 'block';
      settingsLink.textContent = 'Back';
      
      // Load current API key
      browser.storage.local.get('apiKey').then(({ apiKey }) => {
        if (apiKey) {
          apiKeyInput.value = apiKey;
        }
      });
    } else {
      if (apiKey) {
        syncContainer.style.display = 'block';
        apiKeyContainer.style.display = 'none';
        settingsLink.textContent = 'Settings';
      }
    }
  });
  
  // Load sync stats
  async function loadSyncStats() {
    try {
      const { lastSyncTime } = await browser.storage.local.get('lastSyncTime');
      
      if (lastSyncTime) {
        const date = new Date(lastSyncTime);
        lastSync.textContent = date.toLocaleString();
      } else {
        lastSync.textContent = 'Never';
      }
      
      // Get history entries count
      const response = await browser.runtime.sendMessage({ action: 'getHistory', limit: 1000 });
      
      if (response.success) {
        entriesSynced.textContent = response.entries.length;
      }
      
      // Get connected devices (this would come from the server in a real implementation)
      connectedDevices.textContent = '1'; // Default to 1 (current device)
    } catch (error) {
      console.error('Error loading sync stats:', error);
    }
  }
});
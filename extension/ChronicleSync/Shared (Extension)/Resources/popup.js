import { getConfig, saveConfig } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load client ID
  try {
    const config = await getConfig();
    const clientIdElement = document.getElementById('clientId');
    
    if (config.clientId && config.clientId !== 'extension-default') {
      clientIdElement.textContent = config.clientId;
    } else {
      clientIdElement.textContent = 'Not set';
    }
    
    // Load last sync time
    const stored = await browser.storage.local.get(['lastSync']);
    const lastSyncElement = document.getElementById('lastSync');
    
    if (stored.lastSync) {
      const lastSyncDate = new Date(stored.lastSync);
      lastSyncElement.textContent = lastSyncDate.toLocaleString();
    } else {
      lastSyncElement.textContent = 'Never';
    }
  } catch (error) {
    console.error('Error loading popup data:', error);
    document.getElementById('syncStatus').textContent = 'Error: ' + error.message;
  }
  
  // Set up event listeners
  document.getElementById('editClientId').addEventListener('click', () => {
    document.querySelector('.client-id-display').classList.add('hidden');
    document.querySelector('.client-id-edit').classList.remove('hidden');
    
    const clientId = document.getElementById('clientId').textContent;
    if (clientId !== 'Not set') {
      document.getElementById('clientIdInput').value = clientId;
    }
  });
  
  document.getElementById('saveClientId').addEventListener('click', async () => {
    const clientId = document.getElementById('clientIdInput').value.trim();
    
    if (clientId) {
      try {
        await saveConfig({ clientId });
        document.getElementById('clientId').textContent = clientId;
        document.querySelector('.client-id-display').classList.remove('hidden');
        document.querySelector('.client-id-edit').classList.add('hidden');
        
        // Trigger a sync with the new client ID
        browser.runtime.sendMessage({ type: 'triggerSync' });
      } catch (error) {
        console.error('Error saving client ID:', error);
        document.getElementById('syncStatus').textContent = 'Error: ' + error.message;
      }
    }
  });
  
  document.getElementById('syncNow').addEventListener('click', async () => {
    document.getElementById('syncStatus').textContent = 'Syncing...';
    
    try {
      const response = await browser.runtime.sendMessage({ type: 'triggerSync' });
      
      if (response.success) {
        document.getElementById('syncStatus').textContent = 'Sync successful!';
        
        // Update last sync time
        const stored = await browser.storage.local.get(['lastSync']);
        if (stored.lastSync) {
          const lastSyncDate = new Date(stored.lastSync);
          document.getElementById('lastSync').textContent = lastSyncDate.toLocaleString();
        }
      } else {
        document.getElementById('syncStatus').textContent = 'Sync failed: ' + response.error;
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      document.getElementById('syncStatus').textContent = 'Error: ' + error.message;
    }
  });
  
  document.getElementById('viewHistory').addEventListener('click', () => {
    browser.tabs.create({ url: 'history.html' });
  });
  
  document.getElementById('openSettings').addEventListener('click', () => {
    browser.tabs.create({ url: 'settings.html' });
  });
});

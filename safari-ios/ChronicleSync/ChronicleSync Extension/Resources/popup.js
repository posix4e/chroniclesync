// Import the platform adapter
import { storage, runtime } from './src/platform/index.js';

document.addEventListener('DOMContentLoaded', async () => {
  const clientIdInput = document.getElementById('clientId');
  const saveButton = document.getElementById('saveButton');
  const syncButton = document.getElementById('syncButton');
  const statusDiv = document.getElementById('status');
  const lastSyncDiv = document.getElementById('lastSync');

  // Load client ID from storage
  try {
    const result = await storage.local.get(['clientId']);
    if (result.clientId && result.clientId !== 'extension-default') {
      clientIdInput.value = result.clientId;
    }
  } catch (error) {
    showStatus('Error loading client ID: ' + error.message, 'error');
  }

  // Load last sync time
  try {
    const result = await storage.sync.get(['lastSync']);
    if (result.lastSync) {
      lastSyncDiv.textContent = 'Last sync: ' + result.lastSync;
    } else {
      lastSyncDiv.textContent = 'Not synced yet';
    }
  } catch (error) {
    console.error('Error loading last sync time:', error);
  }

  // Save client ID
  saveButton.addEventListener('click', async () => {
    const clientId = clientIdInput.value.trim();
    if (!clientId) {
      showStatus('Please enter a client ID', 'error');
      return;
    }

    try {
      await storage.local.set({ clientId });
      showStatus('Client ID saved successfully', 'success');
    } catch (error) {
      showStatus('Error saving client ID: ' + error.message, 'error');
    }
  });

  // Trigger sync
  syncButton.addEventListener('click', async () => {
    try {
      showStatus('Syncing...', 'info');
      const response = await runtime.sendMessage({ type: 'triggerSync' });
      
      if (response.error) {
        showStatus('Sync failed: ' + response.error, 'error');
      } else {
        showStatus('Sync completed successfully', 'success');
        
        // Update last sync time
        const syncResult = await storage.sync.get(['lastSync']);
        if (syncResult.lastSync) {
          lastSyncDiv.textContent = 'Last sync: ' + syncResult.lastSync;
        }
      }
    } catch (error) {
      showStatus('Error triggering sync: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + (type || 'info');
    statusDiv.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
});
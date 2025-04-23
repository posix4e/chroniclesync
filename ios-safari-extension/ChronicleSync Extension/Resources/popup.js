// Safari iOS Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const clientIdElement = document.getElementById('clientId');
  const syncNowButton = document.getElementById('syncNow');
  const openSettingsButton = document.getElementById('openSettings');
  const viewHistoryButton = document.getElementById('viewHistory');
  const syncStatsElement = document.getElementById('syncStats');
  const sentItemsElement = document.getElementById('sentItems');
  const receivedItemsElement = document.getElementById('receivedItems');
  const deviceCountElement = document.getElementById('deviceCount');

  // Initialize UI
  initializeUI();

  // Add event listeners
  syncNowButton.addEventListener('click', triggerSync);
  openSettingsButton.addEventListener('click', openSettings);
  viewHistoryButton.addEventListener('click', viewHistory);

  // Listen for messages from background script
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'syncComplete') {
      updateSyncStatus('Last sync: ' + new Date().toLocaleTimeString());
      updateSyncStats(message.stats);
      syncStatsElement.classList.remove('hidden');
    } else if (message.type === 'syncError') {
      updateSyncStatus('Sync error: ' + message.error, true);
    }
  });

  // Initialize UI with stored data
  async function initializeUI() {
    try {
      // Get last sync time
      const stored = await browser.storage.sync.get(['lastSync']);
      if (stored.lastSync) {
        updateSyncStatus('Last sync: ' + stored.lastSync);
      } else {
        updateSyncStatus('Never synced');
      }

      // Get client ID
      const response = await browser.runtime.sendMessage({ type: 'getClientId' });
      if (response.clientId) {
        clientIdElement.textContent = response.clientId;
      } else if (response.error) {
        clientIdElement.textContent = 'Error: ' + response.error;
        clientIdElement.classList.add('error');
      } else {
        clientIdElement.textContent = 'Not configured';
      }
    } catch (error) {
      console.error('Error initializing UI:', error);
      updateSyncStatus('Error initializing', true);
    }
  }

  // Update sync status display
  function updateSyncStatus(message, isError = false) {
    statusElement.textContent = message;
    if (isError) {
      statusElement.classList.add('error');
    } else {
      statusElement.classList.remove('error');
    }
  }

  // Update sync stats display
  function updateSyncStats(stats) {
    if (stats) {
      sentItemsElement.textContent = stats.sent || 0;
      receivedItemsElement.textContent = stats.received || 0;
      deviceCountElement.textContent = stats.devices || 0;
    }
  }

  // Trigger manual sync
  async function triggerSync() {
    try {
      updateSyncStatus('Syncing...');
      syncNowButton.disabled = true;
      
      const response = await browser.runtime.sendMessage({ type: 'triggerSync' });
      
      if (response.success) {
        updateSyncStatus('Sync successful');
      } else if (response.error) {
        updateSyncStatus('Sync failed: ' + response.error, true);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      updateSyncStatus('Sync failed', true);
    } finally {
      syncNowButton.disabled = false;
    }
  }

  // Open settings page
  function openSettings() {
    browser.tabs.create({ url: 'settings.html' });
    window.close();
  }

  // View history page
  function viewHistory() {
    browser.tabs.create({ url: 'history.html' });
    window.close();
  }
});
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const syncNowButton = document.getElementById('syncNow');
  const viewHistoryButton = document.getElementById('viewHistory');
  const openSettingsButton = document.getElementById('openSettings');
  const syncStatusElement = document.getElementById('syncStatus');
  const lastSyncElement = document.getElementById('lastSync');
  
  // Load initial state
  loadState();
  
  // Add event listeners
  syncNowButton.addEventListener('click', syncNow);
  viewHistoryButton.addEventListener('click', viewHistory);
  openSettingsButton.addEventListener('click', openSettings);
  
  // Functions
  function loadState() {
    // Get sync status from storage
    browser.storage.local.get(['syncStatus', 'lastSync'], function(result) {
      if (result.syncStatus) {
        syncStatusElement.textContent = result.syncStatus;
      }
      
      if (result.lastSync) {
        const lastSyncDate = new Date(result.lastSync);
        lastSyncElement.textContent = lastSyncDate.toLocaleString();
      }
    });
  }
  
  function syncNow() {
    syncStatusElement.textContent = 'Syncing...';
    
    // Send message to background script to start sync
    browser.runtime.sendMessage({ action: 'syncNow' }, function(response) {
      if (response && response.success) {
        syncStatusElement.textContent = 'Sync completed';
        lastSyncElement.textContent = new Date().toLocaleString();
        
        // Save state to storage
        browser.storage.local.set({
          syncStatus: 'Sync completed',
          lastSync: new Date().toISOString()
        });
      } else {
        syncStatusElement.textContent = 'Sync failed';
      }
    });
  }
  
  function viewHistory() {
    // Open history page in a new tab
    browser.tabs.create({ url: 'history.html' });
  }
  
  function openSettings() {
    // Open settings page in a new tab
    browser.tabs.create({ url: 'settings.html' });
  }
});
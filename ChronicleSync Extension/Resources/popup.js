// Popup script for ChronicleSync Safari Extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const clientIdInput = document.getElementById('client-id');
  const saveClientIdButton = document.getElementById('save-client-id');
  const syncNowButton = document.getElementById('sync-now');
  const viewHistoryButton = document.getElementById('view-history');
  const openSettingsButton = document.getElementById('open-settings');
  const syncStatusElement = document.getElementById('sync-status');
  const lastSyncElement = document.getElementById('last-sync');
  const messageElement = document.getElementById('message');
  
  // Load client ID from storage
  chrome.storage.sync.get(['clientId', 'lastSync'], function(result) {
    if (result.clientId && result.clientId !== 'safari-extension-default') {
      clientIdInput.value = result.clientId;
      syncStatusElement.textContent = 'Ready';
    } else {
      syncStatusElement.textContent = 'Not configured';
    }
    
    if (result.lastSync) {
      lastSyncElement.textContent = result.lastSync;
    }
  });
  
  // Save client ID
  saveClientIdButton.addEventListener('click', function() {
    const clientId = clientIdInput.value.trim();
    
    if (!clientId) {
      showMessage('Please enter a valid client ID', 'error');
      return;
    }
    
    chrome.storage.sync.set({ clientId: clientId }, function() {
      showMessage('Client ID saved successfully', 'success');
      syncStatusElement.textContent = 'Ready';
    });
  });
  
  // Trigger sync
  syncNowButton.addEventListener('click', function() {
    syncStatusElement.textContent = 'Syncing...';
    showMessage('Sync started...', 'info');
    
    chrome.runtime.sendMessage({ type: 'triggerSync' }, function(response) {
      if (response && response.success) {
        syncStatusElement.textContent = 'Synced';
        showMessage('Sync completed successfully', 'success');
        
        // Update last sync time
        chrome.storage.sync.get(['lastSync'], function(result) {
          if (result.lastSync) {
            lastSyncElement.textContent = result.lastSync;
          }
        });
      } else {
        syncStatusElement.textContent = 'Error';
        showMessage(response.error || 'Sync failed', 'error');
      }
    });
  });
  
  // View history
  viewHistoryButton.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });
  
  // Open settings
  openSettingsButton.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
  
  // Listen for sync status updates
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.type === 'syncComplete') {
      syncStatusElement.textContent = 'Synced';
      showMessage(`Sync completed: ${message.stats.sent} sent, ${message.stats.received} received`, 'success');
      
      // Update last sync time
      chrome.storage.sync.get(['lastSync'], function(result) {
        if (result.lastSync) {
          lastSyncElement.textContent = result.lastSync;
        }
      });
    } else if (message.type === 'syncError') {
      syncStatusElement.textContent = 'Error';
      showMessage(message.error || 'Sync failed', 'error');
    }
  });
  
  // Helper function to show messages
  function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = type;
    messageElement.classList.remove('hidden');
    
    setTimeout(function() {
      messageElement.classList.add('hidden');
    }, 5000);
  }
});
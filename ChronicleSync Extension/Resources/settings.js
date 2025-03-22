// Settings page script for ChronicleSync Safari Extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const syncEnabledToggle = document.getElementById('sync-enabled');
  const syncIntervalRange = document.getElementById('sync-interval');
  const syncIntervalValue = document.getElementById('sync-interval-value');
  const maxHistorySelect = document.getElementById('max-history');
  const clientIdInput = document.getElementById('client-id');
  const apiEndpointInput = document.getElementById('api-endpoint');
  const contentExtractionToggle = document.getElementById('content-extraction');
  const clearHistoryButton = document.getElementById('clear-history');
  const saveSettingsButton = document.getElementById('save-settings');
  const messageElement = document.getElementById('message');
  
  // Load settings from storage
  loadSettings();
  
  // Event listeners
  syncIntervalRange.addEventListener('input', function() {
    syncIntervalValue.textContent = syncIntervalRange.value;
  });
  
  saveSettingsButton.addEventListener('click', function() {
    saveSettings();
  });
  
  clearHistoryButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all local history data? This cannot be undone.')) {
      clearHistory();
    }
  });
  
  // Load settings from storage
  function loadSettings() {
    chrome.storage.sync.get([
      'syncEnabled',
      'syncInterval',
      'maxHistoryItems',
      'clientId',
      'apiEndpoint',
      'contentExtraction'
    ], function(result) {
      // Sync enabled
      syncEnabledToggle.checked = result.syncEnabled !== false; // Default to true
      
      // Sync interval
      if (result.syncInterval) {
        const intervalMinutes = Math.floor(result.syncInterval / 60000);
        syncIntervalRange.value = intervalMinutes;
        syncIntervalValue.textContent = intervalMinutes;
      }
      
      // Max history items
      if (result.maxHistoryItems) {
        maxHistorySelect.value = result.maxHistoryItems;
      }
      
      // Client ID
      if (result.clientId && result.clientId !== 'safari-extension-default') {
        clientIdInput.value = result.clientId;
      }
      
      // API endpoint
      if (result.apiEndpoint) {
        apiEndpointInput.value = result.apiEndpoint;
      } else {
        apiEndpointInput.value = 'https://api.chroniclesync.xyz';
      }
      
      // Content extraction
      contentExtractionToggle.checked = result.contentExtraction !== false; // Default to true
    });
  }
  
  // Save settings to storage
  function saveSettings() {
    const settings = {
      syncEnabled: syncEnabledToggle.checked,
      syncInterval: parseInt(syncIntervalRange.value) * 60000, // Convert to milliseconds
      maxHistoryItems: parseInt(maxHistorySelect.value),
      clientId: clientIdInput.value.trim(),
      apiEndpoint: apiEndpointInput.value.trim(),
      contentExtraction: contentExtractionToggle.checked
    };
    
    chrome.storage.sync.set(settings, function() {
      showMessage('Settings saved successfully', 'success');
      
      // Trigger a sync with the new settings
      chrome.runtime.sendMessage({ type: 'triggerSync' });
    });
  }
  
  // Clear history data
  function clearHistory() {
    chrome.runtime.sendMessage({ type: 'clearHistory' }, function(response) {
      if (response && response.success) {
        showMessage('History data cleared successfully', 'success');
      } else {
        showMessage('Failed to clear history data', 'error');
      }
    });
  }
  
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
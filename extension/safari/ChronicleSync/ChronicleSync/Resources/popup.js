// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

document.addEventListener('DOMContentLoaded', async () => {
  const viewHistoryButton = document.getElementById('viewHistory');
  const openSettingsButton = document.getElementById('openSettings');
  const syncNowButton = document.getElementById('syncNow');
  const statusContainer = document.getElementById('status-container');
  
  // Check if settings are configured
  try {
    const response = await browserAPI.runtime.sendMessage({ type: 'checkSettings' });
    
    if (!response.configured) {
      showStatus('Please configure your settings first', 'info');
      
      // If not configured, automatically open settings when clicked
      viewHistoryButton.addEventListener('click', () => {
        browserAPI.runtime.sendMessage({ type: 'openSettings' });
        window.close();
      });
    } else {
      // Normal behavior when configured
      viewHistoryButton.addEventListener('click', () => {
        browserAPI.tabs.create({ url: 'history.html' });
        window.close();
      });
    }
  } catch (error) {
    console.error('Error checking settings:', error);
    showStatus('Error checking settings', 'error');
  }
  
  // Settings button always opens settings
  openSettingsButton.addEventListener('click', () => {
    browserAPI.tabs.create({ url: 'settings.html' });
    window.close();
  });
  
  // Sync now button
  syncNowButton.addEventListener('click', async () => {
    try {
      showStatus('Syncing...', 'info');
      syncNowButton.disabled = true;
      
      const response = await browserAPI.runtime.sendMessage({ type: 'triggerSync' });
      
      if (response.error) {
        showStatus(`Sync failed: ${response.error}`, 'error');
      } else {
        showStatus('Sync completed successfully!', 'success');
      }
    } catch (error) {
      showStatus(`Sync error: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      syncNowButton.disabled = false;
    }
  });
  
  // Check last sync time
  try {
    const data = await browserAPI.storage.local.get(['lastSync']);
    if (data.lastSync) {
      const lastSyncDate = new Date(data.lastSync).toLocaleString();
      showStatus(`Last synced: ${lastSyncDate}`, 'info');
    }
  } catch (error) {
    console.error('Error getting last sync time:', error);
  }
});

// Helper function to show status messages
function showStatus(message, type) {
  const statusContainer = document.getElementById('status-container');
  statusContainer.innerHTML = '';
  
  const statusElement = document.createElement('div');
  statusElement.className = `status ${type}`;
  statusElement.textContent = message;
  
  statusContainer.appendChild(statusElement);
}
// Popup script for iOS Safari extension

document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const syncNowButton = document.getElementById('sync-now');
  const openAppButton = document.getElementById('open-app');
  const settingsLink = document.getElementById('settings-link');
  
  // Load sync status
  try {
    const data = await browser.storage.local.get(['lastSyncTime', 'lastSyncStatus', 'lastSyncError', 'lastSyncStats', 'clientId']);
    
    if (!data.clientId || data.clientId === 'extension-default') {
      statusElement.textContent = 'Please configure your Client ID in the app settings';
      statusElement.className = 'status error';
    } else if (data.lastSyncStatus === 'error') {
      statusElement.textContent = `Sync error: ${data.lastSyncError || 'Unknown error'}`;
      statusElement.className = 'status error';
    } else if (data.lastSyncTime) {
      const lastSync = new Date(data.lastSyncTime);
      const stats = data.lastSyncStats || { sent: 0, received: 0 };
      
      statusElement.innerHTML = `
        Last sync: ${lastSync.toLocaleString()}<br>
        Sent: ${stats.sent} entries<br>
        Received: ${stats.received} entries
      `;
      statusElement.className = 'status success';
    } else {
      statusElement.textContent = 'No sync performed yet';
      statusElement.className = 'status';
    }
  } catch (error) {
    console.error('Error loading sync status:', error);
    statusElement.textContent = 'Error loading sync status';
    statusElement.className = 'status error';
  }
  
  // Set up sync now button
  syncNowButton.addEventListener('click', async () => {
    try {
      statusElement.textContent = 'Syncing...';
      statusElement.className = 'status';
      
      // Send message to background script to trigger sync
      await browser.runtime.sendMessage({ type: 'syncNow' });
      
      // Reload popup after a delay to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      statusElement.textContent = `Sync error: ${error.message}`;
      statusElement.className = 'status error';
    }
  });
  
  // Set up open app button
  openAppButton.addEventListener('click', () => {
    // Use a custom URL scheme to open the main app
    window.open('chroniclesync://open');
  });
  
  // Set up settings link
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Open settings in the main app
    window.open('chroniclesync://settings');
  });
});
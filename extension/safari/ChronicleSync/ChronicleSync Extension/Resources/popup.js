// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const statusElement = document.getElementById('status');
  const toggleSyncButton = document.getElementById('toggleSync');
  const viewHistoryButton = document.getElementById('viewHistory');
  const openSettingsButton = document.getElementById('openSettings');
  
  // Get current settings
  try {
    const settings = await browser.storage.local.get(['enabled', 'syncHistory']);
    
    // Update UI based on settings
    if (settings.enabled && settings.syncHistory) {
      statusElement.textContent = 'Active';
      statusElement.style.color = '#34c759';
      toggleSyncButton.textContent = 'Pause Sync';
    } else {
      statusElement.textContent = 'Paused';
      statusElement.style.color = '#ff9500';
      toggleSyncButton.textContent = 'Resume Sync';
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    statusElement.textContent = 'Error';
    statusElement.style.color = '#ff3b30';
  }
  
  // Toggle sync button
  toggleSyncButton.addEventListener('click', async () => {
    try {
      const settings = await browser.storage.local.get(['enabled', 'syncHistory']);
      const newState = !(settings.enabled && settings.syncHistory);
      
      await browser.storage.local.set({
        enabled: newState,
        syncHistory: newState
      });
      
      // Update UI
      if (newState) {
        statusElement.textContent = 'Active';
        statusElement.style.color = '#34c759';
        toggleSyncButton.textContent = 'Pause Sync';
      } else {
        statusElement.textContent = 'Paused';
        statusElement.style.color = '#ff9500';
        toggleSyncButton.textContent = 'Resume Sync';
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
    }
  });
  
  // View history button
  viewHistoryButton.addEventListener('click', () => {
    browser.tabs.create({ url: browser.runtime.getURL('history.html') });
    window.close();
  });
  
  // Open settings button
  openSettingsButton.addEventListener('click', () => {
    browser.runtime.openOptionsPage();
    window.close();
  });
});
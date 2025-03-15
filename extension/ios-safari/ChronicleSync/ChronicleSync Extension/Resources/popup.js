// Popup script for Safari extension
// This is adapted from the Chrome/Firefox extension

document.addEventListener('DOMContentLoaded', async () => {
  // Get UI elements
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const syncNowBtn = document.getElementById('syncNowBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const historyBtn = document.getElementById('historyBtn');
  
  // Initialize UI
  await updateStatus();
  
  // Add event listeners
  syncNowBtn.addEventListener('click', handleSyncNow);
  settingsBtn.addEventListener('click', openSettings);
  historyBtn.addEventListener('click', openHistory);
  
  // Function to update status indicator
  async function updateStatus() {
    try {
      // Get settings from background script
      const response = await browser.runtime.sendMessage({
        type: 'GET_SETTINGS'
      });
      
      if (response.settings && response.settings.syncEnabled) {
        statusDot.classList.add('active');
        statusDot.classList.remove('inactive');
        statusText.textContent = 'Sync is active';
      } else {
        statusDot.classList.add('inactive');
        statusDot.classList.remove('active');
        statusText.textContent = 'Sync is disabled';
      }
    } catch (error) {
      console.error('Error updating status:', error);
      statusText.textContent = 'Error checking status';
    }
  }
  
  // Function to handle sync now button
  async function handleSyncNow() {
    try {
      statusText.textContent = 'Syncing...';
      
      // Get current tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length === 0) {
        throw new Error('No active tab found');
      }
      
      // Send message to content script to extract page data
      const response = await browser.tabs.sendMessage(tabs[0].id, {
        type: 'EXTRACT_PAGE_DATA'
      });
      
      if (response && response.success) {
        // Send data to background script
        await browser.runtime.sendMessage({
          type: 'HISTORY_ITEM',
          data: response.data
        });
        
        statusText.textContent = 'Sync completed';
        setTimeout(updateStatus, 2000);
      } else {
        throw new Error('Failed to extract page data');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      statusText.textContent = 'Sync failed';
      setTimeout(updateStatus, 2000);
    }
  }
  
  // Function to open settings page
  function openSettings() {
    browser.runtime.openOptionsPage();
    window.close();
  }
  
  // Function to open history page
  function openHistory() {
    browser.tabs.create({ url: 'history.html' });
    window.close();
  }
});
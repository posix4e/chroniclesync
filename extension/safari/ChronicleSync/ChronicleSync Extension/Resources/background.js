// This is the background script for the Safari extension
// It will be adapted from the Chrome/Firefox background.js

// Listen for installation
browser.runtime.onInstalled.addListener(() => {
  console.log('ChronicleSync Safari Extension installed');
  
  // Initialize storage with default settings
  browser.storage.local.set({
    enabled: true,
    syncHistory: true,
    apiEndpoint: 'https://api-staging.chroniclesync.xyz'
  });
});

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background script:', message);
  
  if (message.type === 'PAGE_VISIT') {
    // Handle page visit
    recordPageVisit(message.url, message.title, message.timestamp);
    sendResponse({ status: 'success' });
  }
  
  return true; // Keep the message channel open for async response
});

// Function to record page visit
async function recordPageVisit(url, title, timestamp) {
  try {
    // Get settings
    const settings = await browser.storage.local.get(['enabled', 'syncHistory', 'apiEndpoint']);
    
    if (!settings.enabled || !settings.syncHistory) {
      console.log('History sync is disabled');
      return;
    }
    
    // Record the visit in local storage first
    const visits = await browser.storage.local.get('visits') || { visits: [] };
    visits.visits.push({
      url,
      title,
      timestamp,
      synced: false
    });
    
    await browser.storage.local.set(visits);
    
    // Try to sync with the server
    syncWithServer(settings.apiEndpoint);
  } catch (error) {
    console.error('Error recording page visit:', error);
  }
}

// Function to sync with server
async function syncWithServer(apiEndpoint) {
  try {
    // Get unsynced visits
    const data = await browser.storage.local.get('visits');
    const visits = data.visits || [];
    const unsyncedVisits = visits.filter(visit => !visit.synced);
    
    if (unsyncedVisits.length === 0) {
      return;
    }
    
    // Send to server
    const response = await fetch(`${apiEndpoint}/api/history/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ visits: unsyncedVisits })
    });
    
    if (response.ok) {
      // Mark as synced
      const updatedVisits = visits.map(visit => {
        if (!visit.synced) {
          return { ...visit, synced: true };
        }
        return visit;
      });
      
      await browser.storage.local.set({ visits: updatedVisits });
    }
  } catch (error) {
    console.error('Error syncing with server:', error);
  }
}
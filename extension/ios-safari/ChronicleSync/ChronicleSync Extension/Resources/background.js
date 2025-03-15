// Background script for Safari extension
// This is adapted from the Chrome/Firefox extension

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.type === 'HISTORY_ITEM') {
    // Process history item
    processHistoryItem(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true; // Indicates we'll respond asynchronously
  }
  
  if (message.type === 'GET_SETTINGS') {
    // Return settings
    browser.storage.local.get('settings')
      .then(result => sendResponse({ settings: result.settings || {} }))
      .catch(error => sendResponse({ error: error.toString() }));
    return true; // Indicates we'll respond asynchronously
  }
});

// Process history item
async function processHistoryItem(data) {
  try {
    // Get API endpoint from settings
    const { settings } = await browser.storage.local.get('settings');
    const apiEndpoint = (settings && settings.apiEndpoint) || 'https://api-staging.chroniclesync.xyz';
    
    // Send data to API
    const response = await fetch(`${apiEndpoint}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing history item:', error);
    throw error;
  }
}

// Initialize extension
async function initializeExtension() {
  // Set default settings if not already set
  const { settings } = await browser.storage.local.get('settings');
  
  if (!settings) {
    await browser.storage.local.set({
      settings: {
        apiEndpoint: 'https://api-staging.chroniclesync.xyz',
        syncEnabled: true,
        syncFrequency: 'realtime',
      }
    });
  }
  
  console.log('ChronicleSync Safari extension initialized');
}

// Call initialize function
initializeExtension();
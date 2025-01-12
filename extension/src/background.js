// Configuration
const API_URL = 'https://your-api-url.com';
let isInitialized = false;

// Initialize the extension
async function initialize() {
  if (isInitialized) return;
  
  const storage = await chrome.storage.local.get(['lastSync']);
  const lastSync = storage.lastSync || Date.now() - (24 * 60 * 60 * 1000); // Default to last 24 hours
  
  // Initial sync
  await syncHistory(lastSync);
  isInitialized = true;
}

// Sync history since the last sync time
async function syncHistory(startTime) {
  try {
    const historyItems = await chrome.history.search({
      text: '',
      startTime,
      maxResults: 1000
    });

    // Filter and transform history items
    const historyData = historyItems.map(item => ({
      url: item.url,
      title: item.title,
      visitTime: item.lastVisitTime,
      visitCount: item.visitCount
    }));

    // Send to backend
    if (historyData.length > 0) {
      await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyData)
      });
    }

    // Update last sync time
    await chrome.storage.local.set({ lastSync: Date.now() });
  } catch (error) {
    console.error('Error syncing history:', error);
  }
}

// Listen for new history items
chrome.history.onVisited.addListener(async (historyItem) => {
  try {
    const data = {
      url: historyItem.url,
      title: historyItem.title,
      visitTime: historyItem.lastVisitTime,
      visitCount: 1
    };

    await fetch(`${API_URL}/api/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([data])
    });
  } catch (error) {
    console.error('Error syncing new history item:', error);
  }
});

// Initialize when the extension loads
initialize();
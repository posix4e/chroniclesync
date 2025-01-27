// Simple in-memory queue for pending history items
let pendingItems: Array<{url: string, title: string, timestamp: number}> = [];

// Function to sync items with the server
async function syncItems() {
  if (pendingItems.length === 0) return;

  const itemsToSync = [...pendingItems];
  pendingItems = []; // Clear the queue

  try {
    const config = await chrome.storage.sync.get(['apiEndpoint']);
    const endpoint = config.apiEndpoint || 'https://api.chroniclesync.xyz';

    const response = await fetch(`${endpoint}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: itemsToSync })
    });

    if (!response.ok) {
      // If sync fails, add items back to queue
      pendingItems.push(...itemsToSync);
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Sync error:', error);
    // Items are already back in queue if sync failed
  }
}

// Listen for history updates
chrome.history.onVisited.addListener(async (result) => {
  if (result.url) {
    // Add to pending queue
    pendingItems.push({
      url: result.url,
      title: result.title || '',
      timestamp: new Date(result.lastVisitTime || Date.now()).getTime()
    });

    // Try to sync immediately
    await syncItems();
  }
});

// Listen for manual sync requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'sync') {
    syncItems()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});
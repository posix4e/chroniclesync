// Function to get pending items from storage
async function getPendingItems(): Promise<Array<{url: string, title: string, timestamp: number}>> {
  const data = await chrome.storage.local.get('pendingItems');
  return data.pendingItems || [];
}

// Function to save pending items to storage
async function savePendingItems(items: Array<{url: string, title: string, timestamp: number}>) {
  await chrome.storage.local.set({ pendingItems: items });
}

// Function to sync items with the server
async function syncItems() {
  const pendingItems = await getPendingItems();
  if (pendingItems.length === 0) return;

  const itemsToSync = [...pendingItems];
  await savePendingItems([]); // Clear the queue

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
      const currentItems = await getPendingItems();
      await savePendingItems([...currentItems, ...itemsToSync]);
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Sync error:', error);
    // Items are already back in queue if sync failed
  }
}

// Set up alarm for periodic sync
chrome.alarms.create('periodicSync', {
  periodInMinutes: 5 // Sync every 5 minutes
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    syncItems();
  }
});

// Listen for history updates
chrome.history.onVisited.addListener(async (result) => {
  if (result.url) {
    // Add to pending queue
    const currentItems = await getPendingItems();
    await savePendingItems([...currentItems, {
      url: result.url,
      title: result.title || '',
      timestamp: new Date(result.lastVisitTime || Date.now()).getTime()
    }]);

    // Try to sync immediately
    await syncItems();
  }
});

// Listen for messages from popup and tests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
  case 'sync':
    syncItems()
      .then(() => {
        // Notify any listeners about sync completion
        chrome.runtime.sendMessage({ type: 'sync', status: 'success' });
        sendResponse({ success: true });
      })
      .catch(error => {
        // Notify any listeners about sync failure
        chrome.runtime.sendMessage({ type: 'sync', status: 'error' });
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously

  case 'getPendingItems':
    // For testing: return the current pending items queue
    getPendingItems()
      .then(items => sendResponse({ items }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously

  case 'clearPendingItems':
    // For testing: clear the pending items queue
    savePendingItems([])
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Will respond asynchronously
  }
});
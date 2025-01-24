import { api } from './utils/api';

// Initialize background script
console.log('ChronicleSync background script initialized');

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: number;
  deviceId: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SYNC_HISTORY') {
    syncHistory(request.deviceId).then(sendResponse);
    return true;
  }
});

async function syncHistory(deviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get local history
    const history = await chrome.history.search({
      text: '',
      maxResults: 100,
      startTime: Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    });

    const historyItems: HistoryItem[] = history.map(item => ({
      id: item.id || Math.random().toString(36).substring(2),
      url: item.url || '',
      title: item.title || '',
      visitTime: item.lastVisitTime || Date.now(),
      deviceId
    }));

    // Send to server
    await api.post('/history/sync', { items: historyItems });

    // Get history from server
    const response = await api.get<{ items: HistoryItem[] }>('/history');
    const serverItems = response.data.items;

    // Add new items from other devices to local history
    for (const item of serverItems) {
      if (item.deviceId !== deviceId) {
        await chrome.history.addUrl({
          url: item.url
        });
      }
    }

    return { success: true, message: 'History sync completed successfully' };
  } catch (error) {
    console.error('History sync failed:', error);
    return { success: false, message: 'History sync failed: ' + (error as Error).message };
  }
}
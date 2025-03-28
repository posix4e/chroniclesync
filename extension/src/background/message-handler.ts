import { HistoryStore } from '../db/HistoryStore';
import { syncHistory, initializeExtension } from './history-sync';
import { getClientId } from '../api/client';

/**
 * Sets up message listeners for the extension
 */
export function setupMessageListeners(): void {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getClientId') {
      handleGetClientId(sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'triggerSync') {
      handleTriggerSync(sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'getHistory') {
      handleGetHistory(request, sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'getDevices') {
      handleGetDevices(sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'deleteHistory') {
      handleDeleteHistory(request, sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'pageContentExtracted') {
      handlePageContentExtracted(request, sendResponse);
      return true; // Will respond asynchronously
    } else if (request.type === 'searchHistory') {
      handleSearchHistory(request, sendResponse);
      return true; // Will respond asynchronously
    }
  });
}

async function handleGetClientId(sendResponse: (response: any) => void): Promise<void> {
  try {
    chrome.storage.local.get(['initialized']).then(async result => {
      if (!result.initialized) {
        const success = await initializeExtension();
        if (!success) {
          sendResponse({ error: 'Extension not initialized' });
          return;
        }
      }

      try {
        const clientId = await getClientId();
        sendResponse({ clientId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error getting client ID:', errorMessage);
        sendResponse({ error: 'Failed to get client ID' });
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendResponse({ error: errorMessage });
  }
}

async function handleTriggerSync(sendResponse: (response: any) => void): Promise<void> {
  try {
    await syncHistory(true);
    sendResponse({ success: true, message: 'Sync successful' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Manual sync failed:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

async function handleGetHistory(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { deviceId, since, limit } = request;
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    const entries = await historyStore.getEntries(deviceId, since);
    const limitedEntries = limit ? entries.slice(0, limit) : entries;
    sendResponse(limitedEntries);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching history:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

async function handleGetDevices(sendResponse: (response: any) => void): Promise<void> {
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    const devices = await historyStore.getDevices();
    sendResponse(devices);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching devices:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

async function handleDeleteHistory(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { visitId } = request;
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    await historyStore.deleteEntry(visitId);
    await syncHistory(false);
    sendResponse({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error deleting history entry:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

async function handlePageContentExtracted(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { url, content, summary } = request.data;
  
  if (url && (content || summary)) {
    const historyStore = new HistoryStore();
    
    try {
      await historyStore.init();
      await historyStore.updatePageContent(url, { content, summary });
      console.debug('Updated page content for:', url);
      sendResponse({ success: true });
      
      // Trigger a sync to send the updated content to the server
      setTimeout(() => syncHistory(false), 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error updating page content:', errorMessage);
      sendResponse({ error: errorMessage });
    }
  }
}

async function handleSearchHistory(request: any, sendResponse: (response: any) => void): Promise<void> {
  const { query } = request;
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    const results = await historyStore.searchContent(query);
    
    // Format the results for display
    const formattedResults = results.map(result => ({
      visitId: result.entry.visitId,
      url: result.entry.url,
      title: result.entry.title,
      visitTime: result.entry.visitTime,
      matches: result.matches
    }));
    
    sendResponse({ success: true, results: formattedResults });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error searching history:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}
import { getConfig } from '../../config';
import { HistoryStore } from '../db/HistoryStore';
import { initializeExtension, syncHistory } from './sync';

/**
 * Message handler module - Processes extension messages
 */

/**
 * Set up message handlers for the extension
 */
export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
      case 'getClientId':
        handleGetClientId(sendResponse);
        return true; // Will respond asynchronously
        
      case 'triggerSync':
        handleTriggerSync(sendResponse);
        return true; // Will respond asynchronously
        
      case 'getHistory':
        handleGetHistory(request, sendResponse);
        return true; // Will respond asynchronously
        
      case 'getDevices':
        handleGetDevices(sendResponse);
        return true; // Will respond asynchronously
        
      case 'deleteHistory':
        handleDeleteHistory(request, sendResponse);
        return true; // Will respond asynchronously
        
      case 'pageContentExtracted':
        handlePageContentExtracted(request, sendResponse);
        return true; // Will respond asynchronously
        
      case 'searchHistory':
        handleSearchHistory(request, sendResponse);
        return true; // Will respond asynchronously
    }
  });
}

/**
 * Handle getClientId message
 */
async function handleGetClientId(sendResponse: (response: any) => void): Promise<void> {
  try {
    const result = await chrome.storage.local.get(['initialized']);
    if (!result.initialized) {
      const success = await initializeExtension();
      if (!success) {
        sendResponse({ error: 'Extension not initialized' });
        return;
      }
    }

    const config = await getConfig();
    sendResponse({ clientId: config.clientId === 'extension-default' ? null : config.clientId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting client ID:', errorMessage);
    sendResponse({ error: 'Failed to get client ID' });
  }
}

/**
 * Handle triggerSync message
 */
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

/**
 * Handle getHistory message
 */
async function handleGetHistory(
  request: { deviceId?: string, since?: number, limit?: number },
  sendResponse: (response: any) => void
): Promise<void> {
  const { deviceId, since, limit } = request;
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    const entries = await historyStore.getEntries(deviceId, since);
    const limitedEntries = limit ? entries.slice(0, limit) : entries;
    sendResponse(limitedEntries);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching history from IndexedDB:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

/**
 * Handle getDevices message
 */
async function handleGetDevices(sendResponse: (response: any) => void): Promise<void> {
  const historyStore = new HistoryStore();
  
  try {
    await historyStore.init();
    const devices = await historyStore.getDevices();
    sendResponse(devices);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching devices from IndexedDB:', errorMessage);
    sendResponse({ error: errorMessage });
  }
}

/**
 * Handle deleteHistory message
 */
async function handleDeleteHistory(
  request: { visitId: string },
  sendResponse: (response: any) => void
): Promise<void> {
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

/**
 * Handle pageContentExtracted message
 */
async function handlePageContentExtracted(
  request: { data: { url: string, content: string, summary: string } },
  sendResponse: (response: any) => void
): Promise<void> {
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

/**
 * Handle searchHistory message
 */
async function handleSearchHistory(
  request: { query: string },
  sendResponse: (response: any) => void
): Promise<void> {
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
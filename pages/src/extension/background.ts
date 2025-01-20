import { HistoryManager } from './history';
import { Crypto } from './crypto';
import { Storage } from './storage';

// Initialize managers
const historyManager = new HistoryManager();
const crypto = new Crypto();
const storage = new Storage(crypto);

// Listen for history updates
chrome.history.onVisited.addListener(async (historyItem) => {
    try {
        const encryptedData = await crypto.encrypt(JSON.stringify({
            url: historyItem.url,
            title: historyItem.title,
            lastVisitTime: historyItem.lastVisitTime,
            visitCount: historyItem.visitCount,
            typedCount: historyItem.typedCount
        }));
        
        await storage.store(`history:${Date.now()}`, encryptedData);
    } catch (error) {
        console.error('Failed to process history item:', error);
    }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case 'SYNC_HISTORY':
            historyManager.syncHistory().then(sendResponse);
            return true; // Will respond asynchronously
        
        case 'PROCESS_HISTORY_ITEM':
            processHistoryItem(request.item).then(sendResponse);
            return true;
    }
});

async function processHistoryItem(historyItem: chrome.history.HistoryItem) {
    try {
        const encryptedData = await crypto.encrypt(JSON.stringify({
            url: historyItem.url,
            title: historyItem.title,
            lastVisitTime: historyItem.lastVisitTime,
            visitCount: historyItem.visitCount,
            typedCount: historyItem.typedCount
        }));
        
        await storage.store(`history:${Date.now()}`, encryptedData);
    } catch (error) {
        console.error('Failed to process history item:', error);
    }
}
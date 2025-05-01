// Service Worker for P2P History Sync
import * as Automerge from '@automerge/automerge';
import { get, set } from 'idb-keyval';

// Constants
const ALARM_NAME = 'p2p-sync';
const SYNC_INTERVAL_MINUTES = 60; // Sync every hour
const OFFSCREEN_PATH = 'offscreen.html';
const OFFSCREEN_ID = 'p2p-sync-offscreen';
const STORAGE_KEY_DOC = 'history-doc';
const STORAGE_KEY_SECRET = 'sync-secret';
const STORAGE_KEY_LAST_SYNC = 'last-sync-time';

// Initialize the extension
async function initialize() {
  console.log('P2P History Sync: Initializing service worker');
  
  // Create alarm for periodic sync
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: SYNC_INTERVAL_MINUTES
  });
  
  // Listen for history visits
  chrome.history.onVisited.addListener(handleHistoryVisit);
  
  // Listen for alarms
  chrome.alarms.onAlarm.addListener(handleAlarm);
  
  // Listen for messages from offscreen document
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle new history visits
async function handleHistoryVisit(historyItem) {
  try {
    // Get the current document or create a new one
    let doc = await getHistoryDoc();
    
    // Update the document with the new history item
    doc = Automerge.change(doc, 'Add history item', doc => {
      if (!doc.visits) doc.visits = [];
      doc.visits.push({
        id: historyItem.id,
        url: historyItem.url,
        title: historyItem.title || '',
        visitTime: historyItem.lastVisitTime,
        timestamp: Date.now()
      });
    });
    
    // Save the updated document
    await saveHistoryDoc(doc);
    console.log('P2P History Sync: Added new history item');
  } catch (error) {
    console.error('P2P History Sync: Error handling history visit', error);
  }
}

// Handle alarms
async function handleAlarm(alarm) {
  if (alarm.name === ALARM_NAME) {
    console.log('P2P History Sync: Alarm triggered, starting sync');
    await startSync();
  }
}

// Start the sync process by creating an offscreen document
async function startSync() {
  try {
    // Check if we have a secret
    const secret = await get(STORAGE_KEY_SECRET);
    if (!secret) {
      console.log('P2P History Sync: No secret set, skipping sync');
      return;
    }
    
    // Check if offscreen document already exists
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    
    if (existingContexts.length > 0) {
      console.log('P2P History Sync: Offscreen document already exists');
      return;
    }
    
    // Create offscreen document
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['BLOBS'],
      justification: 'P2P sync requires persistent connection',
      id: OFFSCREEN_ID
    });
    
    console.log('P2P History Sync: Created offscreen document for sync');
  } catch (error) {
    console.error('P2P History Sync: Error starting sync', error);
  }
}

// Handle messages from offscreen document
function handleMessage(message, sender, sendResponse) {
  if (message.type === 'sync-complete') {
    console.log('P2P History Sync: Sync completed');
    // Update last sync time
    set(STORAGE_KEY_LAST_SYNC, Date.now());
    // Close the offscreen document
    chrome.offscreen.closeDocument();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'sync-update') {
    // Handle incoming sync data
    handleSyncUpdate(message.data);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === 'get-sync-data') {
    // Send current document to offscreen
    getHistoryDoc().then(doc => {
      sendResponse({ 
        doc: Automerge.save(doc),
        secret: get(STORAGE_KEY_SECRET)
      });
    });
    return true;
  }
}

// Handle sync updates from peers
async function handleSyncUpdate(syncData) {
  try {
    // Get current document
    let localDoc = await getHistoryDoc();
    
    // Parse the incoming document
    const remoteDoc = Automerge.load(syncData);
    
    // Merge the documents
    const mergedDoc = Automerge.merge(localDoc, remoteDoc);
    
    // Save the merged document
    await saveHistoryDoc(mergedDoc);
    
    console.log('P2P History Sync: Merged remote changes');
  } catch (error) {
    console.error('P2P History Sync: Error handling sync update', error);
  }
}

// Get the history document from storage
async function getHistoryDoc() {
  try {
    const savedDoc = await get(STORAGE_KEY_DOC);
    if (savedDoc) {
      return Automerge.load(savedDoc);
    } else {
      // Create a new document
      return Automerge.init();
    }
  } catch (error) {
    console.error('P2P History Sync: Error getting history doc', error);
    return Automerge.init();
  }
}

// Save the history document to storage
async function saveHistoryDoc(doc) {
  try {
    const savedDoc = Automerge.save(doc);
    await set(STORAGE_KEY_DOC, savedDoc);
  } catch (error) {
    console.error('P2P History Sync: Error saving history doc', error);
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(initialize);

// Initialize on startup
initialize();
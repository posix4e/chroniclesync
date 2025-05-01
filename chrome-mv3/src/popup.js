// Popup script for P2P History Sync
import { get, set } from 'idb-keyval';
import { format } from 'timeago.js';

// Constants
const STORAGE_KEY_SECRET = 'sync-secret';
const STORAGE_KEY_LAST_SYNC = 'last-sync-time';
const ALARM_NAME = 'p2p-sync';

// DOM Elements
const statusElement = document.getElementById('status');
const lastSyncedElement = document.getElementById('last-synced');
const secretInput = document.getElementById('secret');
const saveButton = document.getElementById('save-btn');
const syncButton = document.getElementById('sync-btn');

// Initialize the popup
async function initialize() {
  try {
    // Load the current secret
    const secret = await get(STORAGE_KEY_SECRET);
    if (secret) {
      secretInput.value = secret;
      statusElement.textContent = 'Configured';
    } else {
      statusElement.textContent = 'Not configured';
    }
    
    // Load the last sync time
    const lastSyncTime = await get(STORAGE_KEY_LAST_SYNC);
    if (lastSyncTime) {
      lastSyncedElement.textContent = format(lastSyncTime);
    } else {
      lastSyncedElement.textContent = 'Never';
    }
    
    // Set up event listeners
    saveButton.addEventListener('click', saveSecret);
    syncButton.addEventListener('click', triggerSync);
  } catch (error) {
    console.error('Error initializing popup:', error);
    statusElement.textContent = `Error: ${error.message}`;
  }
}

// Save the sync secret
async function saveSecret() {
  try {
    const secret = secretInput.value.trim();
    
    if (!secret) {
      statusElement.textContent = 'Error: Secret cannot be empty';
      return;
    }
    
    // Save the secret
    await set(STORAGE_KEY_SECRET, secret);
    
    statusElement.textContent = 'Configured';
    
    // Trigger a sync
    triggerSync();
  } catch (error) {
    console.error('Error saving secret:', error);
    statusElement.textContent = `Error: ${error.message}`;
  }
}

// Trigger a sync
async function triggerSync() {
  try {
    // Check if we have a secret
    const secret = await get(STORAGE_KEY_SECRET);
    
    if (!secret) {
      statusElement.textContent = 'Error: No secret configured';
      return;
    }
    
    // Trigger the alarm
    chrome.alarms.create(ALARM_NAME, { delayInMinutes: 0 });
    
    statusElement.textContent = 'Sync started';
  } catch (error) {
    console.error('Error triggering sync:', error);
    statusElement.textContent = `Error: ${error.message}`;
  }
}

// Initialize when the document loads
document.addEventListener('DOMContentLoaded', initialize);
import { getConfig, saveConfig } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Load current settings
  try {
    const config = await getConfig();
    
    // Populate form fields
    document.getElementById('clientId').value = config.clientId !== 'extension-default' ? config.clientId : '';
    document.getElementById('apiEndpoint').value = config.apiEndpoint || 'https://api.chroniclesync.xyz/sync';
    document.getElementById('syncInterval').value = config.syncInterval || 5;
    document.getElementById('extractContent').checked = config.extractContent !== false;
    
    // Set up event listeners
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('resetSettings').addEventListener('click', resetSettings);
    document.getElementById('clearLocalData').addEventListener('click', clearLocalData);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', importData);
    
  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
});

async function saveSettings() {
  try {
    const newConfig = {
      clientId: document.getElementById('clientId').value.trim() || 'extension-default',
      apiEndpoint: document.getElementById('apiEndpoint').value.trim() || 'https://api.chroniclesync.xyz/sync',
      syncInterval: parseInt(document.getElementById('syncInterval').value) || 5,
      extractContent: document.getElementById('extractContent').checked
    };
    
    await saveConfig(newConfig);
    showStatus('Settings saved successfully!', 'success');
    
    // Trigger a sync with the new settings
    browser.runtime.sendMessage({ type: 'triggerSync' });
    
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
}

async function resetSettings() {
  try {
    const defaultConfig = {
      clientId: 'extension-default',
      apiEndpoint: 'https://api.chroniclesync.xyz/sync',
      syncInterval: 5,
      extractContent: true
    };
    
    await saveConfig(defaultConfig);
    
    // Update form fields
    document.getElementById('clientId').value = '';
    document.getElementById('apiEndpoint').value = defaultConfig.apiEndpoint;
    document.getElementById('syncInterval').value = defaultConfig.syncInterval;
    document.getElementById('extractContent').checked = defaultConfig.extractContent;
    
    showStatus('Settings reset to defaults', 'success');
    
  } catch (error) {
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
}

async function clearLocalData() {
  if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
    try {
      // Clear IndexedDB
      const request = indexedDB.deleteDatabase('ChronicleSync');
      
      request.onsuccess = async () => {
        // Clear local storage
        await browser.storage.local.clear();
        
        showStatus('All local data has been cleared', 'success');
      };
      
      request.onerror = () => {
        throw new Error('Failed to delete database');
      };
      
    } catch (error) {
      showStatus('Error clearing data: ' + error.message, 'error');
    }
  }
}

async function exportData() {
  try {
    // Get all data
    const config = await getConfig();
    const storage = await browser.storage.local.get();
    
    // Create export object
    const exportData = {
      config,
      storage,
      exportDate: new Date().toISOString()
    };
    
    // Convert to JSON and create download link
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'chroniclesync-backup-' + new Date().toISOString().split('T')[0] + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showStatus('Data exported successfully', 'success');
    
  } catch (error) {
    showStatus('Error exporting data: ' + error.message, 'error');
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate imported data
          if (!importedData.config) {
            throw new Error('Invalid backup file: missing configuration');
          }
          
          // Import config
          await saveConfig(importedData.config);
          
          // Import storage data
          if (importedData.storage) {
            await browser.storage.local.clear();
            await browser.storage.local.set(importedData.storage);
          }
          
          // Reload form with new settings
          document.getElementById('clientId').value = importedData.config.clientId !== 'extension-default' ? importedData.config.clientId : '';
          document.getElementById('apiEndpoint').value = importedData.config.apiEndpoint || 'https://api.chroniclesync.xyz/sync';
          document.getElementById('syncInterval').value = importedData.config.syncInterval || 5;
          document.getElementById('extractContent').checked = importedData.config.extractContent !== false;
          
          showStatus('Data imported successfully', 'success');
          
        } catch (error) {
          showStatus('Error parsing import file: ' + error.message, 'error');
        }
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      showStatus('Error importing data: ' + error.message, 'error');
    }
  };
  
  input.click();
}

function showStatus(message, type) {
  const statusElement = document.getElementById('statusMessage');
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
  statusElement.style.display = 'block';
  
  // Hide after 5 seconds
  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 5000);
}
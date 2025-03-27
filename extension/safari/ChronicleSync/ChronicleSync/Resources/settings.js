import { getConfig, saveConfig, resetConfig } from './config.js';

// Detect browser environment
const isSafari = typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo;
const browserAPI = isSafari ? browser : chrome;

// DOM elements
let mnemonicInput;
let clientIdInput;
let environmentSelect;
let customUrlContainer;
let customApiUrlInput;
let expirationDaysInput;
let saveSettingsButton;
let resetSettingsButton;
let generateMnemonicButton;
let showMnemonicButton;
let statusContainer;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  mnemonicInput = document.getElementById('mnemonic');
  clientIdInput = document.getElementById('clientId');
  environmentSelect = document.getElementById('environment');
  customUrlContainer = document.getElementById('customUrlContainer');
  customApiUrlInput = document.getElementById('customApiUrl');
  expirationDaysInput = document.getElementById('expirationDays');
  saveSettingsButton = document.getElementById('saveSettings');
  resetSettingsButton = document.getElementById('resetSettings');
  generateMnemonicButton = document.getElementById('generateMnemonic');
  showMnemonicButton = document.getElementById('showMnemonic');
  statusContainer = document.getElementById('status-container');
  
  // Load current settings
  await loadSettings();
  
  // Set up event listeners
  environmentSelect.addEventListener('change', toggleCustomUrlVisibility);
  saveSettingsButton.addEventListener('click', saveSettings);
  resetSettingsButton.addEventListener('click', resetSettings);
  generateMnemonicButton.addEventListener('click', generateMnemonic);
  showMnemonicButton.addEventListener('click', toggleMnemonicVisibility);
  mnemonicInput.addEventListener('input', updateClientId);
});

// Load settings from storage
async function loadSettings() {
  try {
    const config = await getConfig();
    
    // Populate form fields
    mnemonicInput.value = config.mnemonic || '';
    clientIdInput.value = config.clientId === 'extension-default' ? '' : config.clientId;
    environmentSelect.value = config.environment || 'production';
    customApiUrlInput.value = config.customApiUrl || '';
    expirationDaysInput.value = config.expirationDays || 7;
    
    // Set mnemonic field type
    mnemonicInput.type = 'password';
    
    // Show/hide custom URL field
    toggleCustomUrlVisibility();
    
    // Update client ID if mnemonic exists
    if (config.mnemonic) {
      updateClientId();
    }
  } catch (error) {
    showStatus('Error loading settings: ' + error.message, 'error');
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    // Validate inputs
    const mnemonic = mnemonicInput.value.trim();
    const environment = environmentSelect.value;
    const customApiUrl = customApiUrlInput.value.trim();
    const expirationDays = parseInt(expirationDaysInput.value, 10);
    
    if (!mnemonic) {
      throw new Error('Mnemonic phrase is required');
    }
    
    if (environment === 'custom' && !customApiUrl) {
      throw new Error('Custom API URL is required when using Custom environment');
    }
    
    if (isNaN(expirationDays) || expirationDays < 1) {
      throw new Error('History expiration must be at least 1 day');
    }
    
    // Generate client ID from mnemonic
    const clientId = await generateClientIdFromMnemonic(mnemonic);
    
    // Save config
    const config = {
      mnemonic,
      clientId,
      environment,
      customApiUrl,
      expirationDays
    };
    
    const success = await saveConfig(config);
    
    if (success) {
      showStatus('Settings saved successfully!', 'success');
      
      // Trigger a sync with the new settings
      try {
        await browserAPI.runtime.sendMessage({ type: 'triggerSync' });
      } catch (error) {
        console.error('Error triggering sync:', error);
      }
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
}

// Reset settings to defaults
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    try {
      const success = await resetConfig();
      
      if (success) {
        await loadSettings();
        showStatus('Settings reset to defaults', 'success');
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
    }
  }
}

// Generate a new mnemonic phrase
async function generateMnemonic() {
  try {
    // This is a simplified version - in a real implementation, you'd use a proper BIP39 library
    const wordlist = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit',
      'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
      'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter',
      'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
      'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique'
    ];
    
    const getRandomWord = () => wordlist[Math.floor(Math.random() * wordlist.length)];
    const words = Array(24).fill(0).map(() => getRandomWord());
    
    mnemonicInput.value = words.join(' ');
    updateClientId();
  } catch (error) {
    showStatus('Error generating mnemonic: ' + error.message, 'error');
  }
}

// Toggle mnemonic visibility
function toggleMnemonicVisibility() {
  if (mnemonicInput.type === 'password') {
    mnemonicInput.type = 'text';
    showMnemonicButton.textContent = 'Hide';
  } else {
    mnemonicInput.type = 'password';
    showMnemonicButton.textContent = 'Show';
  }
}

// Update client ID based on mnemonic
async function updateClientId() {
  try {
    const mnemonic = mnemonicInput.value.trim();
    
    if (mnemonic) {
      const clientId = await generateClientIdFromMnemonic(mnemonic);
      clientIdInput.value = clientId;
    } else {
      clientIdInput.value = '';
    }
  } catch (error) {
    console.error('Error updating client ID:', error);
  }
}

// Generate client ID from mnemonic
async function generateClientIdFromMnemonic(mnemonic) {
  try {
    // In a real implementation, you'd use a proper crypto library
    // This is a simplified version that creates a hash-like string
    
    // Simple hash function
    const simpleHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16);
    };
    
    // Generate a client ID based on the mnemonic
    const hash = simpleHash(mnemonic);
    const clientId = `cs-${hash.substring(0, 8)}-${hash.substring(8, 16)}`;
    
    return clientId;
  } catch (error) {
    console.error('Error generating client ID:', error);
    return 'error-generating-id';
  }
}

// Toggle custom URL visibility based on environment selection
function toggleCustomUrlVisibility() {
  if (environmentSelect.value === 'custom') {
    customUrlContainer.style.display = 'block';
  } else {
    customUrlContainer.style.display = 'none';
  }
}

// Show status message
function showStatus(message, type) {
  statusContainer.innerHTML = '';
  
  const statusElement = document.createElement('div');
  statusElement.className = `status ${type}`;
  statusElement.textContent = message;
  
  statusContainer.appendChild(statusElement);
  
  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusContainer.innerHTML = '';
    }, 5000);
  }
}
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock bip39 wordlist
vi.mock('../../bip39-wordlist.js', () => ({
  wordList: ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'art']
}));

// Mock chrome.storage.sync
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

// Debug logging for crypto object state
console.log('Initial crypto state:', {
  hasCrypto: typeof crypto !== 'undefined',
  hasGlobalCrypto: typeof global.crypto !== 'undefined',
  cryptoType: typeof crypto,
  globalCryptoType: typeof global.crypto,
  hasSubtle: crypto && typeof crypto.subtle !== 'undefined',
  hasGlobalSubtle: global.crypto && typeof global.crypto.subtle !== 'undefined',
  subtleType: crypto && typeof crypto.subtle,
  globalSubtleType: global.crypto && typeof global.crypto.subtle,
});

// Mock crypto API methods
const mockGetRandomValues = vi.fn((array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

const mockDigest = vi.fn(async (_algorithm, _data) => {
  // Simple mock that returns a fixed hash for testing
  return new Uint8Array([
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20
  ]).buffer;
});

// Ensure crypto objects exist before mocking
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.subtle) {
  global.crypto.subtle = {};
}

// In Node.js test environment, crypto might be different from global.crypto
if (typeof crypto === 'undefined' || !crypto) {
  global.crypto = global.crypto || {};
  global.crypto.subtle = global.crypto.subtle || {};
  global.crypto.getRandomValues = global.crypto.getRandomValues || (() => {});
  globalThis.crypto = global.crypto;
}

// Mock the methods on the crypto object
vi.spyOn(global.crypto, 'getRandomValues').mockImplementation(mockGetRandomValues);
vi.spyOn(global.crypto.subtle, 'digest').mockImplementation(mockDigest);

// Debug logging for crypto object state after mocking
console.log('Crypto state after mocking:', {
  hasCrypto: typeof crypto !== 'undefined',
  hasGlobalCrypto: typeof global.crypto !== 'undefined',
  cryptoType: typeof crypto,
  globalCryptoType: typeof global.crypto,
  hasSubtle: crypto && typeof crypto.subtle !== 'undefined',
  hasGlobalSubtle: global.crypto && typeof global.crypto.subtle !== 'undefined',
  subtleType: crypto && typeof crypto.subtle,
  globalSubtleType: global.crypto && typeof global.crypto.subtle,
});

// Import Settings after mocks
import { Settings } from '../src/settings/Settings';

describe('Settings', () => {
  let settings;
  let mockContainer;

  beforeEach(async () => {
    settings = new Settings();
    mockContainer = document.createElement('div');
    mockContainer.id = 'settings-container';
    document.body.appendChild(mockContainer);

    // Add required form elements
    const form = document.createElement('form');
    
    // Mnemonic input
    const mnemonicInput = document.createElement('textarea');
    mnemonicInput.id = 'mnemonic';
    form.appendChild(mnemonicInput);

    // Client ID input
    const clientIdInput = document.createElement('input');
    clientIdInput.id = 'clientId';
    form.appendChild(clientIdInput);

    // Environment select
    const environmentSelect = document.createElement('select');
    environmentSelect.id = 'environment';
    ['production', 'staging', 'custom'].forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      environmentSelect.appendChild(option);
    });
    form.appendChild(environmentSelect);

    // Custom URL container and input
    const customUrlContainer = document.createElement('div');
    customUrlContainer.id = 'customUrlContainer';
    customUrlContainer.style.display = 'none';
    
    const customApiUrlInput = document.createElement('input');
    customApiUrlInput.id = 'customApiUrl';
    customApiUrlInput.type = 'url';
    customUrlContainer.appendChild(customApiUrlInput);
    
    // Expiration days input
    const expirationDaysInput = document.createElement('input');
    expirationDaysInput.id = 'expirationDays';
    expirationDaysInput.type = 'number';
    expirationDaysInput.min = '1';
    expirationDaysInput.value = '7';
    form.appendChild(expirationDaysInput);
    
    // Sync mode select
    const syncModeSelect = document.createElement('select');
    syncModeSelect.id = 'syncMode';
    ['server', 'p2p'].forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      syncModeSelect.appendChild(option);
    });
    form.appendChild(syncModeSelect);
    
    // P2P settings container
    const p2pSettingsContainer = document.createElement('div');
    p2pSettingsContainer.id = 'p2pSettingsContainer';
    p2pSettingsContainer.style.display = 'none';
    
    // ICE server provider select
    const iceServerProviderSelect = document.createElement('select');
    iceServerProviderSelect.id = 'iceServerProvider';
    ['google', 'custom'].forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      iceServerProviderSelect.appendChild(option);
    });
    p2pSettingsContainer.appendChild(iceServerProviderSelect);
    
    // Custom ICE servers container
    const customIceServersContainer = document.createElement('div');
    customIceServersContainer.id = 'customIceServersContainer';
    customIceServersContainer.style.display = 'none';
    p2pSettingsContainer.appendChild(customIceServersContainer);
    
    // Custom ICE servers textarea
    const customIceServersTextarea = document.createElement('textarea');
    customIceServersTextarea.id = 'customIceServers';
    customIceServersTextarea.value = '[{"urls":"stun:stun.example.com"}]';
    customIceServersContainer.appendChild(customIceServersTextarea);
    
    form.appendChild(customUrlContainer);
    form.appendChild(p2pSettingsContainer);
    mockContainer.appendChild(form);

    // Add settings actions container with buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'settings-actions';
    
    const saveButton = document.createElement('button');
    saveButton.id = 'saveSettings';
    saveButton.textContent = 'Save Settings';
    actionsDiv.appendChild(saveButton);

    const resetButton = document.createElement('button');
    resetButton.id = 'resetSettings';
    resetButton.textContent = 'Reset Settings';
    actionsDiv.appendChild(resetButton);

    mockContainer.appendChild(actionsDiv);

    // Reset mocks
    chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset();

    // Mock storage to return default values
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        clientId: 'test-client',
        environment: 'production',
        customApiUrl: null,
        expirationDays: 7,
        syncMode: 'server',
        p2pSignalServerType: 'production',
        p2pDiscoveryServer: 'wss://api.chroniclesync.xyz'
      });
    });

    // Initialize settings
    await settings.init();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('initializes with null config', () => {
    const newSettings = new Settings();
    expect(newSettings.config).toBeNull();
  });

  it('init loads and renders config', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Create a mock config
    const mockConfig = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'test-client',
      customApiUrl: 'http://test-api.com',
      environment: 'custom',
      expirationDays: 7,
      syncMode: 'p2p',
      iceServerProvider: 'custom',
      customIceServers: '[{"urls":"stun:stun.example.com"}]'
    };
    
    // Directly set the config
    settings.config = mockConfig;
    
    // Call render method
    settings.render();
    
    // Verify the form fields are populated correctly
    expect(document.getElementById('clientId').value).toBe(mockConfig.clientId);
    expect(document.getElementById('environment').value).toBe(mockConfig.environment);
    expect(document.getElementById('customApiUrl').value).toBe(mockConfig.customApiUrl);
    expect(document.getElementById('syncMode').value).toBe(mockConfig.syncMode);
    expect(document.getElementById('iceServerProvider').value).toBe(mockConfig.iceServerProvider);
    expect(document.getElementById('customIceServers').value).toBe(mockConfig.customIceServers);
    
    // Verify containers are displayed correctly
    expect(document.getElementById('customUrlContainer').style.display).toBe('block');
    expect(document.getElementById('customIceServersContainer').style.display).toBe('block');
  });

  it('handleSave updates config and shows success message', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    const newConfig = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'new-client',
      customApiUrl: 'http://new-api.com',
      environment: 'custom',
      expirationDays: 7,
      syncMode: 'p2p',
      iceServerProvider: 'custom',
      customIceServers: '[{"urls":"stun:stun.example.com"}]'
    };

    // Mock generateClientId to return the expected client ID
    vi.spyOn(settings, 'generateClientId').mockResolvedValue(newConfig.clientId);
    
    // Mock chrome.storage.sync.set to call the callback
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    
    // Set up form values
    document.getElementById('mnemonic').value = newConfig.mnemonic;
    document.getElementById('clientId').value = newConfig.clientId;
    document.getElementById('environment').value = newConfig.environment;
    document.getElementById('customApiUrl').value = newConfig.customApiUrl;
    document.getElementById('syncMode').value = newConfig.syncMode;
    document.getElementById('expirationDays').value = String(newConfig.expirationDays);
    document.getElementById('iceServerProvider').value = newConfig.iceServerProvider;
    document.getElementById('customIceServers').value = newConfig.customIceServers;

    const mockEvent = {
      preventDefault: vi.fn()
    };

    // Call handleSave
    await settings.handleSave(mockEvent);

    // Verify the event was prevented
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    
    // Verify chrome.storage.sync.set was called with the correct data
    expect(chrome.storage.sync.set).toHaveBeenCalled();
    
    // Verify the config was updated
    expect(settings.config.mnemonic).toBe(newConfig.mnemonic);
    expect(settings.config.clientId).toBe(newConfig.clientId);
    expect(settings.config.environment).toBe(newConfig.environment);
    expect(settings.config.customApiUrl).toBe(newConfig.customApiUrl);
  });

  it('handleReset resets to default config when confirmed', async () => {
    // Mock confirm to return true
    global.confirm = vi.fn(() => true);
    
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Mock generateMnemonic to return a specific value
    vi.spyOn(settings, 'generateMnemonic').mockReturnValue('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art');
    
    // Mock generateClientId to return a specific value
    vi.spyOn(settings, 'generateClientId').mockResolvedValue('default-client');
    
    // Mock chrome.storage.sync.set to call the callback
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    
    // Set up initial config
    settings.config = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'custom-client',
      customApiUrl: 'http://custom-api.com',
      environment: 'custom',
      syncMode: 'p2p',
      iceServerProvider: 'custom',
      customIceServers: '[{"urls":"stun:stun.example.com"}]'
    };
    
    // Call handleReset
    await settings.handleReset();
    
    // Verify confirm was called
    expect(global.confirm).toHaveBeenCalled();
    
    // Verify chrome.storage.sync.set was called
    expect(chrome.storage.sync.set).toHaveBeenCalled();
    
    // Verify the config was reset to defaults
    expect(settings.config.environment).toBe('production');
    expect(settings.config.customApiUrl).toBeNull();
    
    // Verify the UI was updated
    expect(document.getElementById('environment').value).toBe('production');
    expect(document.getElementById('customUrlContainer').style.display).toBe('none');
  });

  it('shows/hides custom URL field based on environment', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Set up the DOM elements directly
    document.getElementById('environment').value = 'custom';
    
    // Manually trigger the change event
    settings.handleEnvironmentChange();
    
    const customUrlContainer = document.getElementById('customUrlContainer');
    
    // Should be visible in custom environment
    expect(customUrlContainer.style.display).toBe('block');
    
    // Change to staging environment
    document.getElementById('environment').value = 'staging';
    
    // Manually trigger the change event
    settings.handleEnvironmentChange();
    
    // Should be hidden in staging environment
    expect(customUrlContainer.style.display).toBe('none');
  });
  
  it('shows/hides custom ICE servers field based on iceServerProvider', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Set up the DOM elements directly
    document.getElementById('iceServerProvider').value = 'custom';
    
    // Manually trigger the change event
    settings.handleIceServerProviderChange();
    
    const customIceServersContainer = document.getElementById('customIceServersContainer');
    
    // Should be visible with custom ICE server provider
    expect(customIceServersContainer.style.display).toBe('block');
    
    // Change to google provider
    document.getElementById('iceServerProvider').value = 'google';
    
    // Manually trigger the change event
    settings.handleIceServerProviderChange();
    
    // Should be hidden with google ICE server provider
    expect(customIceServersContainer.style.display).toBe('none');
  });

  it('validates custom URL when saving', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Set up form values for custom environment without URL
    document.getElementById('mnemonic').value = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    document.getElementById('clientId').value = 'test-client';
    document.getElementById('environment').value = 'custom';
    document.getElementById('customApiUrl').value = '';
    document.getElementById('syncMode').value = 'server';
    document.getElementById('expirationDays').value = '7';
    document.getElementById('iceServerProvider').value = 'google';

    const mockEvent = {
      preventDefault: vi.fn()
    };

    await settings.handleSave(mockEvent);

    // Should not save and show error
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    const errorMessage = document.querySelector('.status-message.error');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toBe('Custom API URL is required when using custom environment');
  });
  
  it('validates custom ICE servers when saving', async () => {
    // Mock validateMnemonic to return true
    vi.spyOn(settings, 'validateMnemonic').mockReturnValue(true);
    
    // Set up form values for custom ICE servers without content
    document.getElementById('mnemonic').value = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    document.getElementById('clientId').value = 'test-client';
    document.getElementById('environment').value = 'production';
    document.getElementById('syncMode').value = 'p2p';
    document.getElementById('expirationDays').value = '7';
    document.getElementById('iceServerProvider').value = 'custom';
    document.getElementById('customIceServers').value = '';

    const mockEvent = {
      preventDefault: vi.fn()
    };

    await settings.handleSave(mockEvent);

    // Should not save and show error
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    const errorMessage = document.querySelector('.status-message.error');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toBe('Custom ICE servers are required when using custom ICE server provider');
  });
});
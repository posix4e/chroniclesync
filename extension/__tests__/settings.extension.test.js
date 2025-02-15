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
    
    form.appendChild(customUrlContainer);
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
        customApiUrl: null
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
    const mockConfig = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'test-client',
      customApiUrl: 'http://test-api.com',
      environment: 'custom'
    };

    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback(mockConfig);
    });

    await settings.init();

    expect(settings.config).toEqual(mockConfig);
    expect(document.getElementById('clientId').value).toBe(mockConfig.clientId);
    expect(document.getElementById('environment').value).toBe(mockConfig.environment);
    expect(document.getElementById('customApiUrl').value).toBe(mockConfig.customApiUrl);
    expect(document.getElementById('customUrlContainer').style.display).toBe('block');
  });

  it('handleSave updates config and shows success message', async () => {
    const newConfig = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'new-client',
      customApiUrl: 'http://new-api.com',
      environment: 'custom'
    };

    // Mock generateClientId to return the expected client ID
    vi.spyOn(settings, 'generateClientId').mockResolvedValue(newConfig.clientId);
    chrome.storage.sync.set.mockImplementation((data, callback) => callback());
    
    // Set up form values
    document.getElementById('mnemonic').value = newConfig.mnemonic;
    document.getElementById('clientId').value = newConfig.clientId;
    document.getElementById('environment').value = newConfig.environment;
    document.getElementById('customApiUrl').value = newConfig.customApiUrl;

    const mockEvent = {
      preventDefault: vi.fn()
    };

    await settings.handleSave(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(newConfig, expect.any(Function));
    expect(settings.config).toEqual(newConfig);
  });

  it('handleReset resets to default config when confirmed', async () => {
    global.confirm = vi.fn(() => true);
    chrome.storage.sync.set.mockImplementation((data, callback) => callback());
    
    settings.config = {
      mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      clientId: 'custom-client',
      customApiUrl: 'http://custom-api.com',
      environment: 'custom'
    };

    await settings.handleReset();

    expect(global.confirm).toHaveBeenCalled();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(expect.any(Object), expect.any(Function));
    expect(settings.config.environment).toBe('production');
    expect(settings.config.customApiUrl).toBeNull();
    expect(document.getElementById('customUrlContainer').style.display).toBe('none');
  });

  it('shows/hides custom URL field based on environment', async () => {
    // Mock storage to return custom environment
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        clientId: 'test-client',
        environment: 'custom',
        customApiUrl: 'http://test-api.com'
      });
    });

    await settings.init();
    const customUrlContainer = document.getElementById('customUrlContainer');

    // Should be visible in custom environment
    expect(customUrlContainer.style.display).toBe('block');

    // Mock storage to return staging environment
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
        clientId: 'test-client',
        environment: 'staging',
        customApiUrl: null
      });
    });

    await settings.init();
    expect(customUrlContainer.style.display).toBe('none');
  });

  it('validates custom URL when saving', async () => {
    // Set up form values for custom environment without URL
    document.getElementById('mnemonic').value = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    document.getElementById('clientId').value = 'test-client';
    document.getElementById('environment').value = 'custom';
    document.getElementById('customApiUrl').value = '';

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
});
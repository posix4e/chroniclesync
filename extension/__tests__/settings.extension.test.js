import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Settings from '../settings.js';

// Mock chrome.storage.sync
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

describe('Settings', () => {
  let settings;
  let mockContainer;

  beforeEach(() => {
    settings = new Settings();
    mockContainer = document.createElement('div');
    mockContainer.id = 'settings-container';
    document.body.appendChild(mockContainer);

    // Add required form elements
    const form = document.createElement('form');
    ['clientId', 'apiUrl', 'pagesUrl'].forEach(id => {
      const input = document.createElement('input');
      input.id = id;
      form.appendChild(input);
    });
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
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('initializes with null config', () => {
    expect(settings.config).toBeNull();
  });

  it('init loads and renders config', async () => {
    const mockConfig = {
      clientId: 'test-client',
      apiUrl: 'http://test-api.com',
      pagesUrl: 'http://test-pages.com'
    };

    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      callback(mockConfig);
    });

    await settings.init();

    expect(settings.config).toEqual(mockConfig);
    expect(document.getElementById('clientId').value).toBe(mockConfig.clientId);
    expect(document.getElementById('apiUrl').value).toBe(mockConfig.apiUrl);
    expect(document.getElementById('pagesUrl').value).toBe(mockConfig.pagesUrl);
  });

  it('handleSave updates config and shows success message', async () => {
    const newConfig = {
      clientId: 'new-client',
      apiUrl: 'http://new-api.com',
      pagesUrl: 'http://new-pages.com'
    };

    settings.config = { ...settings.DEFAULT_SETTINGS };
    chrome.storage.sync.set.mockImplementation((data, callback) => callback());
    
    // Set up form values
    document.getElementById('clientId').value = newConfig.clientId;
    document.getElementById('apiUrl').value = newConfig.apiUrl;
    document.getElementById('pagesUrl').value = newConfig.pagesUrl;

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
      clientId: 'custom-client',
      apiUrl: 'http://custom-api.com',
      pagesUrl: 'http://custom-pages.com'
    };

    await settings.handleReset();

    expect(global.confirm).toHaveBeenCalled();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(settings.DEFAULT_SETTINGS, expect.any(Function));
    expect(settings.config).toEqual(settings.DEFAULT_SETTINGS);
  });
});
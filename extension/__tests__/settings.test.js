import Settings from '../settings.js';
import { getConfig, saveConfig } from '../config.js';

// Mock config module
jest.mock('../config.js', () => ({
  getConfig: jest.fn(),
  saveConfig: jest.fn(),
  defaultConfig: {
    apiEndpoint: 'https://api.chroniclesync.xyz',
    pagesUrl: 'https://chroniclesync.pages.dev',
    clientId: 'extension-default'
  }
}));

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      set: jest.fn().mockImplementation((data, callback) => callback?.()),
      get: jest.fn()
    }
  },
  tabs: {
    create: jest.fn().mockImplementation(() => Promise.resolve())
  },
  runtime: {
    getURL: jest.fn()
  }
};

// Mock DOM elements
document.body.innerHTML = '<div id="settings-container"></div>';

describe('Settings', () => {
  let settings;
  const mockConfig = {
    apiEndpoint: 'https://api.chroniclesync.xyz',
    pagesUrl: 'https://chroniclesync.pages.dev',
    clientId: 'test-client'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    getConfig.mockResolvedValue(mockConfig);
    saveConfig.mockResolvedValue(true);

    settings = new Settings();
  });

  test('initializes with config', async () => {
    await settings.init();
    expect(settings.config).toEqual(mockConfig);
  });

  test('renders form with config values', async () => {
    await settings.init();
    
    const container = document.getElementById('settings-container');
    expect(container.innerHTML).toContain(mockConfig.apiEndpoint);
    expect(container.innerHTML).toContain(mockConfig.pagesUrl);
    expect(container.innerHTML).toContain(mockConfig.clientId);
  });

  test('saves settings successfully', async () => {
    await settings.init();

    const form = document.getElementById('settings-form');
    const event = { preventDefault: jest.fn() };
    form.elements = {
      apiEndpoint: { value: 'https://new-api.chroniclesync.xyz' },
      pagesUrl: { value: 'https://new.chroniclesync.pages.dev' },
      clientId: { value: 'new-client' }
    };

    await settings.handleSave(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      clientId: 'new-client',
      firstTimeSetupComplete: true
    });
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: expect.stringContaining('new-client')
    });
  });

  test('shows error message when save fails', async () => {
    saveConfig.mockResolvedValueOnce(false);
    await settings.init();

    const form = document.getElementById('settings-form');
    const event = { preventDefault: jest.fn() };
    form.elements = {
      apiEndpoint: { value: 'https://new-api.chroniclesync.xyz' },
      pagesUrl: { value: 'https://new.chroniclesync.pages.dev' },
      clientId: { value: 'new-client' }
    };

    await settings.handleSave(event);

    const messageEl = document.getElementById('settings-message');
    expect(messageEl.textContent).toContain('Failed to save settings');
    expect(messageEl.className).toContain('error');
  });

  test('resets settings to defaults', async () => {
    global.confirm = jest.fn().mockReturnValue(true);
    await settings.init();

    await settings.handleReset();

    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      clientId: expect.any(String),
      firstTimeSetupComplete: false
    });
  });
});
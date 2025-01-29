import Settings from '../settings.js';
import { getConfig, saveConfig, defaultConfig } from '../config.js';

jest.mock('../config.js');

describe('Settings', () => {
  let settings;
  let mockContainer;

  beforeEach(() => {
    settings = new Settings();
    mockContainer = document.createElement('div');
    mockContainer.id = 'settings-container';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('initializes with null config', () => {
    expect(settings.config).toBeNull();
  });

  test('init loads and renders config', async () => {
    const mockConfig = {
      apiEndpoint: 'http://test-api.com',
      pagesUrl: 'http://test-pages.com',
      clientId: 'test-client'
    };
    getConfig.mockResolvedValue(mockConfig);

    await settings.init();

    expect(settings.config).toEqual(mockConfig);
    expect(document.getElementById('apiEndpoint').value).toBe(mockConfig.apiEndpoint);
    expect(document.getElementById('pagesUrl').value).toBe(mockConfig.pagesUrl);
    expect(document.getElementById('clientId').value).toBe(mockConfig.clientId);
  });

  test('handleSave updates config and shows success message', async () => {
    const newConfig = {
      apiEndpoint: 'http://new-api.com',
      pagesUrl: 'http://new-pages.com',
      clientId: 'new-client'
    };

    settings.config = { ...defaultConfig };
    saveConfig.mockResolvedValue(true);
    
    const form = document.createElement('form');
    const apiEndpoint = document.createElement('input');
    apiEndpoint.id = 'apiEndpoint';
    apiEndpoint.name = 'apiEndpoint';
    apiEndpoint.value = newConfig.apiEndpoint;
    form.appendChild(apiEndpoint);

    const pagesUrl = document.createElement('input');
    pagesUrl.id = 'pagesUrl';
    pagesUrl.name = 'pagesUrl';
    pagesUrl.value = newConfig.pagesUrl;
    form.appendChild(pagesUrl);

    const clientId = document.createElement('input');
    clientId.id = 'clientId';
    clientId.name = 'clientId';
    clientId.value = newConfig.clientId;
    form.appendChild(clientId);

    // Add message element required by showMessage
    const messageEl = document.createElement('div');
    messageEl.id = 'settings-message';
    document.body.appendChild(messageEl);

    const mockEvent = {
      preventDefault: jest.fn(),
      target: form
    };

    await settings.handleSave(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(saveConfig).toHaveBeenCalledWith(newConfig);
    expect(settings.config).toEqual(newConfig);
  });

  test('handleReset resets to default config when confirmed', async () => {
    global.confirm = jest.fn(() => true);
    saveConfig.mockResolvedValue(true);
    
    settings.config = {
      apiEndpoint: 'http://custom-api.com',
      pagesUrl: 'http://custom-pages.com',
      clientId: 'custom-client'
    };

    await settings.handleReset();

    expect(global.confirm).toHaveBeenCalled();
    expect(saveConfig).toHaveBeenCalledWith(defaultConfig);
    expect(settings.config).toEqual(defaultConfig);
  });
});
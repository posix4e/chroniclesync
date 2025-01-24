describe('Background Service Worker', () => {
  let chrome;
  let consoleSpy;

  beforeEach(() => {
    // Mock chrome API
    chrome = {
      tabs: {
        onUpdated: {
          addListener: jest.fn()
        },
        onActivated: {
          addListener: jest.fn()
        },
        get: jest.fn()
      }
    };
    global.chrome = chrome;
    consoleSpy = jest.spyOn(console, 'log');
    
    // Import background script
    require('../background.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.chrome;
  });

  test('registers tab update listener', () => {
    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
  });

  test('registers tab activation listener', () => {
    expect(chrome.tabs.onActivated.addListener).toHaveBeenCalled();
  });

  test('logs URL when tab is updated', () => {
    const listener = chrome.tabs.onUpdated.addListener.mock.calls[0][0];
    const tabId = 1;
    const changeInfo = { status: 'complete' };
    const tab = { url: 'https://example.com' };

    listener(tabId, changeInfo, tab);
    expect(consoleSpy).toHaveBeenCalledWith('Current webpage:', 'https://example.com');
  });

  test('logs URL when tab is activated', async () => {
    const listener = chrome.tabs.onActivated.addListener.mock.calls[0][0];
    const activeInfo = { tabId: 1 };
    const tab = { url: 'https://example.com' };

    chrome.tabs.get.mockResolvedValue(tab);
    await listener(activeInfo);

    expect(consoleSpy).toHaveBeenCalledWith('Switched to webpage:', 'https://example.com');
  });

  test('handles error when getting tab info', async () => {
    const errorSpy = jest.spyOn(console, 'error');
    const listener = chrome.tabs.onActivated.addListener.mock.calls[0][0];
    const activeInfo = { tabId: 1 };
    const error = new Error('Tab not found');

    chrome.tabs.get.mockRejectedValue(error);
    await listener(activeInfo);

    expect(errorSpy).toHaveBeenCalledWith('Error getting tab info:', error);
  });
});
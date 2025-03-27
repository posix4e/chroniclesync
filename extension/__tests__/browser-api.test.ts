import { browserAPI } from '../src/utils/browser-api';
import { BrowserType } from '../src/utils/platform';

// Mock the platform module
jest.mock('../src/utils/platform', () => ({
  BrowserType: {
    Chrome: 'chrome',
    Firefox: 'firefox',
    Safari: 'safari',
    Unknown: 'unknown'
  },
  detectBrowser: jest.fn(),
  isSafari: jest.fn(),
  isChrome: jest.fn(),
  isFirefox: jest.fn(),
  isIOS: jest.fn(),
  isSafariIOS: jest.fn()
}));

// Import the mocked module
import { detectBrowser } from '../src/utils/platform';

describe('Browser API Abstraction', () => {
  const mockDetectBrowser = detectBrowser as jest.Mock;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Mock Chrome by default
    mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
    
    // Mock Chrome APIs
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ testKey: 'testValue' })),
          set: jest.fn((items, callback) => callback()),
          remove: jest.fn((keys, callback) => callback()),
          clear: jest.fn((callback) => callback())
        }
      },
      tabs: {
        query: jest.fn((queryInfo, callback) => callback([{ id: 1, url: 'https://example.com' }])),
        create: jest.fn((options, callback) => callback({ id: 2, url: options.url })),
        sendMessage: jest.fn((tabId, message, callback) => callback({ response: 'ok' }))
      },
      runtime: {
        sendMessage: jest.fn((message, callback) => callback({ response: 'ok' })),
        onMessage: {
          addListener: jest.fn()
        }
      },
      history: {
        search: jest.fn((query, callback) => callback([{ url: 'https://example.com', title: 'Example' }]))
      }
    };
    
    // Mock Safari APIs
    global.safari = {
      extension: {
        settings: {
          getItem: jest.fn((key) => key === 'testKey' ? 'testValue' : null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          key: jest.fn((index) => index === 0 ? 'testKey' : null),
          length: 1
        },
        dispatchMessage: jest.fn()
      },
      application: {
        activeBrowserWindow: {
          activeTab: {
            id: 1,
            url: 'https://example.com',
            title: 'Example'
          },
          openTab: jest.fn(() => ({
            id: 2,
            url: ''
          })),
          tabs: []
        },
        browserWindows: [],
        addEventListener: jest.fn()
      },
      self: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    };
  });
  
  afterEach(() => {
    // Clean up
    delete global.chrome;
    delete global.safari;
  });
  
  describe('Storage API', () => {
    test('get should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.storage.get('testKey');
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('testKey', expect.any(Function));
      expect(result).toEqual({ testKey: 'testValue' });
    });
    
    test('get should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.storage.get('testKey');
      
      expect(safari.extension.settings.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({ testKey: 'testValue' });
    });
    
    test('set should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      await browserAPI.storage.set({ testKey: 'newValue' });
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'newValue' }, expect.any(Function));
    });
    
    test('set should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      await browserAPI.storage.set({ testKey: 'newValue' });
      
      expect(safari.extension.settings.setItem).toHaveBeenCalledWith('testKey', 'newValue');
    });
  });
  
  describe('Tabs API', () => {
    test('getActive should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.tabs.getActive();
      
      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function));
      expect(result).toEqual({ id: 1, url: 'https://example.com' });
    });
    
    test('getActive should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.tabs.getActive();
      
      expect(result).toEqual({ id: 1, url: 'https://example.com', title: 'Example' });
    });
    
    test('create should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.tabs.create({ url: 'https://example.org' });
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: 'https://example.org' }, expect.any(Function));
      expect(result).toEqual({ id: 2, url: 'https://example.org' });
    });
    
    test('create should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.tabs.create({ url: 'https://example.org' });
      
      expect(safari.application.activeBrowserWindow.openTab).toHaveBeenCalled();
      expect(result).toEqual({ id: 2, url: undefined });
    });
  });
  
  describe('Runtime API', () => {
    test('sendMessage should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.runtime.sendMessage({ action: 'test' });
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'test' }, expect.any(Function));
      expect(result).toEqual({ response: 'ok' });
    });
    
    test('sendMessage should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      // This is more complex to test due to event listeners
      // We'll just verify the dispatch happens
      const promise = browserAPI.runtime.sendMessage({ action: 'test' });
      
      expect(safari.extension.dispatchMessage).toHaveBeenCalledWith('fromPage', { action: 'test' });
      expect(safari.self.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      
      // Resolve the promise to avoid test warnings
      // In a real scenario, the event listener would call the resolve function
      await promise.catch(() => {});
    });
  });
  
  describe('History API', () => {
    test('search should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.history.search({ text: 'example', maxResults: 10 });
      
      expect(chrome.history.search).toHaveBeenCalledWith({ text: 'example', maxResults: 10 }, expect.any(Function));
      expect(result).toEqual([{ url: 'https://example.com', title: 'Example' }]);
    });
    
    test('search should return empty array in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.history.search({ text: 'example', maxResults: 10 });
      
      expect(result).toEqual([]);
    });
  });
});
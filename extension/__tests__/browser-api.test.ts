import { browserAPI } from '../src/utils/browser-api';
import { BrowserType } from '../src/utils/platform';
import '../src/types/safari';
import '../src/types/firefox';

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

// Define mock types to satisfy TypeScript
interface MockChrome {
  storage: {
    local: {
      get: jest.Mock;
      set: jest.Mock;
      remove: jest.Mock;
      clear: jest.Mock;
    }
  };
  tabs: {
    query: jest.Mock;
    create: jest.Mock;
    sendMessage: jest.Mock;
  };
  runtime: {
    sendMessage: jest.Mock;
    onMessage: {
      addListener: jest.Mock;
    }
  };
  history: {
    search: jest.Mock;
  }
}

interface MockSafari {
  extension: {
    settings: {
      getItem: jest.Mock;
      setItem: jest.Mock;
      removeItem: jest.Mock;
      key: jest.Mock;
      length: number;
    };
    dispatchMessage: jest.Mock;
  };
  application: {
    activeBrowserWindow: {
      activeTab: {
        id: number;
        url: string;
        title: string;
      };
      openTab: jest.Mock;
      tabs: any[];
    };
    browserWindows: any[];
    addEventListener: jest.Mock;
  };
  self: {
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  }
}

describe('Browser API Abstraction', () => {
  const mockDetectBrowser = detectBrowser as jest.Mock;
  let mockChrome: MockChrome;
  let mockSafari: MockSafari;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Mock Chrome by default
    mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
    
    // Mock Chrome APIs
    mockChrome = {
      storage: {
        local: {
          get: jest.fn((keys, callback) => callback({ testKey: 'testValue' })),
          set: jest.fn((items, callback) => callback()),
          remove: jest.fn((keys, callback) => callback()),
          clear: jest.fn((callback) => callback())
        }
      },
      tabs: {
        query: jest.fn((queryInfo, callback) => callback([{
          id: 1,
          url: 'https://example.com',
          index: 0,
          pinned: false,
          highlighted: false,
          windowId: 0,
          active: true,
          incognito: false,
          selected: true,
          discarded: false,
          autoDiscardable: false,
          title: 'Example'
        }])),
        create: jest.fn((options, callback) => callback({
          id: 2,
          url: options.url,
          index: 0,
          pinned: false,
          highlighted: false,
          windowId: 0,
          active: true,
          incognito: false,
          selected: true,
          discarded: false,
          autoDiscardable: false,
          title: 'Example'
        })),
        sendMessage: jest.fn((tabId, message, callback) => callback({ response: 'ok' }))
      },
      runtime: {
        sendMessage: jest.fn((message, callback) => callback({ response: 'ok' })),
        onMessage: {
          addListener: jest.fn()
        }
      },
      history: {
        search: jest.fn((query, callback) => callback([{
          id: '1',
          url: 'https://example.com',
          title: 'Example',
          lastVisitTime: Date.now(),
          visitCount: 1
        }]))
      }
    };
    
    // Mock Safari APIs
    mockSafari = {
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
    
    // Assign mocks to global objects
    (global as any).chrome = mockChrome;
    (global as any).safari = mockSafari;
  });
  
  afterEach(() => {
    // Clean up
    delete (global as any).chrome;
    delete (global as any).safari;
  });
  
  describe('Storage API', () => {
    test('get should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.storage.get('testKey');
      
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith('testKey', expect.any(Function));
      expect(result).toEqual({ testKey: 'testValue' });
    });
    
    test('get should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.storage.get('testKey');
      
      expect(mockSafari.extension.settings.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toEqual({ testKey: 'testValue' });
    });
    
    test('set should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      await browserAPI.storage.set({ testKey: 'newValue' });
      
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'newValue' }, expect.any(Function));
    });
    
    test('set should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      await browserAPI.storage.set({ testKey: 'newValue' });
      
      expect(mockSafari.extension.settings.setItem).toHaveBeenCalledWith('testKey', 'newValue');
    });
  });
  
  describe('Tabs API', () => {
    test('getActive should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.tabs.getActive();
      
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function));
      expect(result).toEqual({
        id: 1,
        url: 'https://example.com',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 0,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: false,
        title: 'Example'
      });
    });
    
    test('getActive should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.tabs.getActive();
      
      expect(result).toEqual({
        id: 1,
        url: 'https://example.com',
        title: 'Example',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 0,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: false
      });
    });
    
    test('create should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.tabs.create({ url: 'https://example.org' });
      
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({ url: 'https://example.org' }, expect.any(Function));
      expect(result).toEqual({
        id: 2,
        url: 'https://example.org',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 0,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: false,
        title: 'Example'
      });
    });
    
    test('create should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.tabs.create({ url: 'https://example.org' });
      
      expect(mockSafari.application.activeBrowserWindow.openTab).toHaveBeenCalled();
      expect(result).toEqual({
        id: 2,
        url: '',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 0,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: false,
        title: ''
      });
    });
  });
  
  describe('Runtime API', () => {
    test('sendMessage should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.runtime.sendMessage({ action: 'test' });
      
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'test' }, expect.any(Function));
      expect(result).toEqual({ response: 'ok' });
    });
    
    test('sendMessage should work in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      // This is more complex to test due to event listeners
      // We'll just verify the dispatch happens
      const promise = browserAPI.runtime.sendMessage({ action: 'test' });
      
      expect(mockSafari.extension.dispatchMessage).toHaveBeenCalledWith('fromPage', { action: 'test' });
      expect(mockSafari.self.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      
      // Resolve the promise to avoid test warnings
      // In a real scenario, the event listener would call the resolve function
      await promise.catch(() => {});
    });
  });
  
  describe('History API', () => {
    test('search should work in Chrome', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Chrome);
      
      const result = await browserAPI.history.search({ text: 'example', maxResults: 10 });
      
      expect(mockChrome.history.search).toHaveBeenCalledWith({ text: 'example', maxResults: 10 }, expect.any(Function));
      expect(result).toEqual([{
        id: '1',
        url: 'https://example.com',
        title: 'Example',
        lastVisitTime: expect.any(Number),
        visitCount: 1
      }]);
    });
    
    test('search should return empty array in Safari', async () => {
      mockDetectBrowser.mockReturnValue(BrowserType.Safari);
      
      const result = await browserAPI.history.search({ text: 'example', maxResults: 10 });
      
      expect(result).toEqual([]);
    });
  });
});
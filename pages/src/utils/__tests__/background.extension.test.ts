/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars, @typescript-eslint/no-require-imports */
type TabChangeInfo = {
  status?: 'loading' | 'complete';
  url?: string;
  pinned?: boolean;
  audible?: boolean;
};

type TabActiveInfo = {
  tabId: number;
  windowId: number;
};

describe('Background Service Worker', () => {
  let consoleSpy: jest.SpyInstance;
  type Tab = {
    id: number;
    index: number;
    url?: string;
    highlighted: boolean;
    active: boolean;
    pinned: boolean;
    windowId: number;
    incognito: boolean;
    selected: boolean;
    discarded: boolean;
    autoDiscardable: boolean;
    groupId: number;
  };

  let tabUpdateListener: ((tabId: number, changeInfo: TabChangeInfo, tab: Tab) => void) | null = null;
  let tabActivateListener: ((activeInfo: TabActiveInfo) => void) | null = null;

  beforeEach(() => {
    // Mock chrome API
    global.chrome = { ...global.chrome };
    global.chrome.tabs = {
      onUpdated: {
        addListener: jest.fn((fn) => {
          tabUpdateListener = fn;
        }),
        hasListener: jest.fn(),
        removeListener: jest.fn(),
        getRules: jest.fn(),
        removeRules: jest.fn(),
        addRules: jest.fn()
      },
      onActivated: {
        addListener: jest.fn((fn) => {
          tabActivateListener = fn;
        }),
        hasListener: jest.fn(),
        removeListener: jest.fn(),
        getRules: jest.fn(),
        removeRules: jest.fn(),
        addRules: jest.fn()
      },
      get: jest.fn()
    } as unknown as typeof chrome.tabs;

    consoleSpy = jest.spyOn(console, 'log');
    
    // Import background script
    jest.isolateModules(() => {
      require('../../../../extension/background.js');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    tabUpdateListener = null;
    tabActivateListener = null;
  });

  test('logs URL when tab is updated', () => {
    expect(tabUpdateListener).toBeDefined();
    if (!tabUpdateListener) return;

    const tabId = 1;
    const changeInfo: TabChangeInfo = { status: 'complete' };
    const tab: Tab = { 
      id: 1,
      index: 0,
      url: 'https://example.com',
      highlighted: false,
      active: false,
      pinned: false,
      windowId: 1,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1
    };

    tabUpdateListener(tabId, changeInfo, tab);
    expect(consoleSpy).toHaveBeenCalledWith('Current webpage:', 'https://example.com');
  });

  test('logs URL when tab is activated', async () => {
    expect(tabActivateListener).toBeDefined();
    if (!tabActivateListener) return;

    const activeInfo: TabActiveInfo = { tabId: 1, windowId: 1 };
    const tab: Tab = { 
      id: 1,
      index: 0,
      url: 'https://example.com',
      highlighted: false,
      active: false,
      pinned: false,
      windowId: 1,
      incognito: false,
      selected: false,
      discarded: false,
      autoDiscardable: true,
      groupId: -1
    };

    (global.chrome.tabs.get as jest.Mock).mockResolvedValue(tab);
    await tabActivateListener(activeInfo);
    
    expect(consoleSpy).toHaveBeenCalledWith('Switched to webpage:', 'https://example.com');
  });
});
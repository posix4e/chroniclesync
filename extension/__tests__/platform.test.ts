import { BrowserType, detectBrowser, isSafari, isChrome, isFirefox, isIOS } from '../src/utils/platform';

// Mock the global objects
declare global {
  interface Window {
    chrome?: any;
    browser?: any;
    safari?: any;
    MSStream?: any;
  }
}

describe('Platform Detection', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;
  
  beforeEach(() => {
    // Reset the mocks before each test
    global.window = {} as any;
    global.navigator = {} as any;
    
    // Reset the navigator.userAgent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });
  });
  
  afterEach(() => {
    // Restore the original objects after each test
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });
  
  test('detectBrowser should detect Chrome', () => {
    // Mock Chrome
    global.window.chrome = {
      runtime: {
        id: 'chrome-extension-id'
      }
    };
    
    expect(detectBrowser()).toBe(BrowserType.Chrome);
    expect(isChrome()).toBe(true);
    expect(isSafari()).toBe(false);
    expect(isFirefox()).toBe(false);
  });
  
  test('detectBrowser should detect Firefox', () => {
    // Mock Firefox
    global.window.browser = {
      runtime: {
        id: 'firefox-extension-id'
      }
    };
    
    expect(detectBrowser()).toBe(BrowserType.Firefox);
    expect(isFirefox()).toBe(true);
    expect(isChrome()).toBe(false);
    expect(isSafari()).toBe(false);
  });
  
  test('detectBrowser should detect Safari', () => {
    // Mock Safari
    global.window.safari = {
      extension: {}
    };
    
    expect(detectBrowser()).toBe(BrowserType.Safari);
    expect(isSafari()).toBe(true);
    expect(isChrome()).toBe(false);
    expect(isFirefox()).toBe(false);
  });
  
  test('detectBrowser should return Unknown for unsupported browsers', () => {
    // No browser-specific objects
    expect(detectBrowser()).toBe(BrowserType.Unknown);
    expect(isChrome()).toBe(false);
    expect(isFirefox()).toBe(false);
    expect(isSafari()).toBe(false);
  });
  
  test('isIOS should detect iOS devices', () => {
    // Mock iOS user agent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      configurable: true
    });
    
    expect(isIOS()).toBe(true);
    
    // Mock non-iOS user agent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      configurable: true
    });
    
    expect(isIOS()).toBe(false);
  });
});
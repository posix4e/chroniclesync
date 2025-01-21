import { getBrowserMetadata, convertChromeHistoryItem } from '../browser';

describe('Browser Utilities', () => {
  describe('getBrowserMetadata', () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
      // Mock navigator for testing
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          vendor: 'Google Inc.',
          language: 'en-US',
          hardwareConcurrency: 8,
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
      });
    });

    it('should extract browser information correctly', () => {
      const metadata = getBrowserMetadata();

      expect(metadata.browserName).toBe('chrome');
      expect(metadata.browserVersion).toBe('91.0.4472.124');
      expect(metadata.osName).toBe('windows');
      expect(metadata.osVersion).toBe('10.0');
      expect(metadata.platform).toBe('Win32');
      expect(metadata.vendor).toBe('Google Inc.');
      expect(metadata.language).toBe('en-US');
      expect(metadata.hardwareConcurrency).toBe(8);
    });

    it('should handle unknown browser and OS gracefully', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Unknown Browser',
          platform: 'Unknown',
          vendor: '',
          language: 'en-US',
        },
        writable: true,
      });

      const metadata = getBrowserMetadata();

      expect(metadata.browserName).toBe('unknown');
      expect(metadata.browserVersion).toBe('unknown');
      expect(metadata.osName).toBe('unknown');
      expect(metadata.osVersion).toBe('unknown');
    });
  });

  describe('convertChromeHistoryItem', () => {
    it('should convert Chrome history item to our format', () => {
      const chromeItem: chrome.history.HistoryItem = {
        id: '123',
        url: 'https://example.com',
        title: 'Example Site',
        lastVisitTime: 1625097600000,
        typedCount: 5,
        visitCount: 10,
      };

      const converted = convertChromeHistoryItem(chromeItem);

      expect(converted).toEqual({
        id: '123',
        url: 'https://example.com',
        title: 'Example Site',
        visitTime: 1625097600000,
        typedCount: 5,
        lastVisitTime: 1625097600000,
      });
    });

    it('should handle missing fields', () => {
      const chromeItem: chrome.history.HistoryItem = {};
      const converted = convertChromeHistoryItem(chromeItem);

      expect(converted.id).toBeDefined();
      expect(converted.url).toBe('');
      expect(converted.title).toBe('');
      expect(converted.visitTime).toBeDefined();
      expect(typeof converted.visitTime).toBe('number');
    });
  });
});
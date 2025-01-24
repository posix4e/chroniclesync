import { getBrowserInfo, getDeviceName, updateDeviceName } from '../devices';

describe('devices utils', () => {
  const mockChromeStorage = {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  };

  beforeAll(() => {
    global.chrome = {
      storage: mockChromeStorage
    } as unknown as typeof chrome;

    // Mock navigator.userAgent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBrowserInfo', () => {
    it('detects Chrome on macOS', () => {
      const info = getBrowserInfo();
      expect(info.browser).toBe('Chrome');
      expect(info.os).toBe('macOS');
    });

    it('detects Firefox on Windows', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      });
      const info = getBrowserInfo();
      expect(info.browser).toBe('Firefox');
      expect(info.os).toBe('Windows');
    });

    it('detects Safari on macOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      });
      const info = getBrowserInfo();
      expect(info.browser).toBe('Safari');
      expect(info.os).toBe('macOS');
    });

    it('handles Linux OS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      const info = getBrowserInfo();
      expect(info.os).toBe('Linux');
    });

    it('returns Unknown for unrecognized browser/OS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Custom Browser'
      });
      const info = getBrowserInfo();
      expect(info.browser).toBe('Unknown');
      expect(info.os).toBe('Unknown');
    });
  });

  describe('getDeviceName', () => {
    it('returns stored device name', async () => {
      mockChromeStorage.sync.get.mockResolvedValue({ deviceName: 'Test Device' });
      const name = await getDeviceName();
      expect(name).toBe('Test Device');
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith('deviceName');
    });

    it('generates and stores new device name if none exists', async () => {
      mockChromeStorage.sync.get.mockResolvedValue({});
      const name = await getDeviceName();
      expect(name).toMatch(/^Device_[a-z0-9]{5}$/);
      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({ deviceName: name });
    });

    it('handles storage errors gracefully', async () => {
      mockChromeStorage.sync.get.mockRejectedValue(new Error('Storage error'));
      const name = await getDeviceName();
      expect(name).toMatch(/^Device_[a-z0-9]{5}$/);
    });
  });

  describe('updateDeviceName', () => {
    it('updates device name in storage', async () => {
      await updateDeviceName('New Device');
      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith({ deviceName: 'New Device' });
    });

    it('throws error if storage fails', async () => {
      mockChromeStorage.sync.set.mockRejectedValue(new Error('Storage error'));
      await expect(updateDeviceName('New Device')).rejects.toThrow('Storage error');
    });
  });
});
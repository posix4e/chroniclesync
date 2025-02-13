import { formatBytes } from '../api';

describe('API utilities', () => {
  describe('API_URL resolution', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          ...originalLocation,
          hostname: '',
        },
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });

    it('returns production URL for chroniclesync.xyz', () => {
      window.location.hostname = 'chroniclesync.xyz';
      // Re-import to get fresh value
      jest.isolateModules(() => {
        const apiModule = jest.requireActual('../api');
        expect(apiModule.API_URL).toBe('https://api.chroniclesync.xyz');
      });
    });

    it('returns staging URL for pages.dev domain', () => {
      window.location.hostname = 'my-branch.chroniclesync.pages.dev';
      jest.isolateModules(() => {
        const apiModule = jest.requireActual('../api');
        expect(apiModule.API_URL).toBe('https://api-staging.chroniclesync.xyz');
      });
    });

    it('returns localhost URL for local development', () => {
      window.location.hostname = 'localhost';
      jest.isolateModules(() => {
        const apiModule = jest.requireActual('../api');
        expect(apiModule.API_URL).toBe('http://localhost:8787');
      });
    });

    it('returns staging URL as fallback for safety', () => {
      window.location.hostname = 'unknown-domain.com';
      jest.isolateModules(() => {
        const apiModule = jest.requireActual('../api');
        expect(apiModule.API_URL).toBe('https://api-staging.chroniclesync.xyz');
      });
    });
  });

  describe('formatBytes', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    });
  });
});
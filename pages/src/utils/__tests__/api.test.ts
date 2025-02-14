import { formatBytes } from '../api';

describe('API utilities', () => {
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

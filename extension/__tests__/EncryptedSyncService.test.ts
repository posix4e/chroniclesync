import { EncryptedSyncService } from '../src/services/EncryptedSyncService';
import { KeyManager } from '../src/services/KeyManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock KeyManager
vi.mock('../src/services/KeyManager', () => ({
  KeyManager: {
    getInstance: vi.fn().mockResolvedValue({
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      generateSeedPhrase: vi.fn(),
      initializeFromSeed: vi.fn()
    })
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock chrome.storage.sync
global.chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
} as unknown as typeof chrome;

describe('EncryptedSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as jest.Mock).mockReset();
    (chrome.storage.sync.get as jest.Mock).mockReset();
  });

  describe('getInstance', () => {
    it('should create a singleton instance', async () => {
      const instance1 = await EncryptedSyncService.getInstance();
      const instance2 = await EncryptedSyncService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize KeyManager', async () => {
      await EncryptedSyncService.getInstance();
      expect(KeyManager.getInstance).toHaveBeenCalled();
    });
  });

  describe('syncToServer', () => {
    it('should encrypt data before sending', async () => {
      const mockEncryptedData = {
        version: 1,
        iv: [1, 2, 3],
        ciphertext: [4, 5, 6],
        metadata: {
          timestamp: Date.now(),
          type: 'history',
          deviceId: 'test-device'
        }
      };

      const mockKeyManager = {
        encrypt: vi.fn().mockResolvedValue(mockEncryptedData),
        decrypt: vi.fn()
      };

      (KeyManager.getInstance as jest.Mock).mockResolvedValue(mockKeyManager);
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ clientId: 'test-client' });
      });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const service = await EncryptedSyncService.getInstance();
      const testData = { test: 'data' };
      await service.syncToServer(testData);

      // Verify data was encrypted
      expect(mockKeyManager.encrypt).toHaveBeenCalledWith(testData);

      // Verify encrypted data was sent
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            encryptedData: mockEncryptedData,
            metadata: mockEncryptedData.metadata
          })
        })
      );
    });

    it('should throw error when encryption is not initialized', async () => {
      (KeyManager.getInstance as jest.Mock).mockResolvedValue(null);
      const service = await EncryptedSyncService.getInstance();
      
      await expect(service.syncToServer({ test: 'data' }))
        .rejects
        .toThrow('Encryption not initialized');
    });

    it('should throw error when client ID is not found', async () => {
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ clientId: null });
      });

      const service = await EncryptedSyncService.getInstance();
      await expect(service.syncToServer({ test: 'data' }))
        .rejects
        .toThrow('Client ID not found');
    });
  });

  describe('getFromServer', () => {
    it('should decrypt received data', async () => {
      const mockEncryptedData = {
        version: 1,
        iv: [1, 2, 3],
        ciphertext: [4, 5, 6],
        metadata: {
          timestamp: Date.now(),
          type: 'history',
          deviceId: 'test-device'
        }
      };

      const mockDecryptedData = {
        history: [{ id: 1, title: 'Test' }]
      };

      const mockKeyManager = {
        encrypt: vi.fn(),
        decrypt: vi.fn().mockResolvedValue(mockDecryptedData)
      };

      (KeyManager.getInstance as jest.Mock).mockResolvedValue(mockKeyManager);
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ clientId: 'test-client' });
      });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ encryptedData: mockEncryptedData })
      });

      const service = await EncryptedSyncService.getInstance();
      const result = await service.getFromServer();

      // Verify data was decrypted
      expect(mockKeyManager.decrypt).toHaveBeenCalledWith(mockEncryptedData);
      expect(result).toEqual(mockDecryptedData.history);
    });

    it('should handle empty response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ encryptedData: null })
      });

      const service = await EncryptedSyncService.getInstance();
      const result = await service.getFromServer();
      expect(result).toEqual([]);
    });

    it('should throw error on decryption failure', async () => {
      const mockKeyManager = {
        encrypt: vi.fn(),
        decrypt: vi.fn().mockRejectedValue(new Error('Decryption failed'))
      };

      (KeyManager.getInstance as jest.Mock).mockResolvedValue(mockKeyManager);
      (chrome.storage.sync.get as jest.Mock).mockImplementation((keys, callback) => {
        callback({ clientId: 'test-client' });
      });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          encryptedData: { version: 1, iv: [], ciphertext: [] } 
        })
      });

      const service = await EncryptedSyncService.getInstance();
      await expect(service.getFromServer())
        .rejects
        .toThrow('Failed to decrypt history data');
    });
  });

  describe('initializeWithSeed', () => {
    it('should initialize encryption with seed phrase', async () => {
      const mockKeyManager = {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        initializeFromSeed: vi.fn().mockResolvedValue(undefined)
      };

      (KeyManager.getInstance as jest.Mock).mockResolvedValue(mockKeyManager);

      const service = await EncryptedSyncService.getInstance();
      const seedPhrase = 'test seed phrase';
      await service.initializeWithSeed(seedPhrase);

      expect(mockKeyManager.initializeFromSeed).toHaveBeenCalledWith(seedPhrase);
    });

    it('should throw error when KeyManager is not available', async () => {
      (KeyManager.getInstance as jest.Mock).mockResolvedValue(null);

      const service = await EncryptedSyncService.getInstance();
      await expect(service.initializeWithSeed('test seed phrase'))
        .rejects
        .toThrow('KeyManager not initialized');
    });
  });

  describe('generateNewSeed', () => {
    it('should generate new seed phrase', async () => {
      const mockSeedPhrase = 'test seed phrase';
      const mockKeyManager = {
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        generateSeedPhrase: vi.fn().mockResolvedValue(mockSeedPhrase)
      };

      (KeyManager.getInstance as jest.Mock).mockResolvedValue(mockKeyManager);

      const service = await EncryptedSyncService.getInstance();
      const result = await service.generateNewSeed();

      expect(result).toBe(mockSeedPhrase);
      expect(mockKeyManager.generateSeedPhrase).toHaveBeenCalled();
    });

    it('should throw error when KeyManager is not available', async () => {
      (KeyManager.getInstance as jest.Mock).mockResolvedValue(null);

      const service = await EncryptedSyncService.getInstance();
      await expect(service.generateNewSeed())
        .rejects
        .toThrow('KeyManager not initialized');
    });
  });
});
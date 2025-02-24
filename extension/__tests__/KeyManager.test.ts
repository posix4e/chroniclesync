import { KeyManager } from '../src/services/KeyManager';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock crypto.subtle
const mockSubtle = {
  importKey: vi.fn(),
  deriveKey: vi.fn(),
  generateKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  exportKey: vi.fn()
};

// Mock crypto.getRandomValues
const mockGetRandomValues = vi.fn((array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Setup global mocks
global.crypto = {
  subtle: mockSubtle,
  getRandomValues: mockGetRandomValues
} as unknown as Crypto;

global.localStorage = mockLocalStorage;

describe('KeyManager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
  });

  describe('getInstance', () => {
    it('should create a singleton instance', async () => {
      const instance1 = await KeyManager.getInstance();
      const instance2 = await KeyManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSeedPhrase', () => {
    it('should generate a valid 12-word seed phrase', async () => {
      const keyManager = await KeyManager.getInstance();
      const seedPhrase = await keyManager.generateSeedPhrase();
      
      // Check if it's 12 words
      const words = seedPhrase.split(' ');
      expect(words).toHaveLength(12);
      
      // Check if random values were generated
      expect(mockGetRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('initializeFromSeed', () => {
    it('should validate seed phrase length', async () => {
      const keyManager = await KeyManager.getInstance();
      const invalidSeed = 'word1 word2'; // Only 2 words
      
      await expect(keyManager.initializeFromSeed(invalidSeed))
        .rejects
        .toThrow('Seed phrase must be 12 words');
    });

    it('should validate seed phrase words', async () => {
      const keyManager = await KeyManager.getInstance();
      const invalidSeed = 'invalid1 invalid2 invalid3 invalid4 invalid5 invalid6 invalid7 invalid8 invalid9 invalid10 invalid11 invalid12';
      
      await expect(keyManager.initializeFromSeed(invalidSeed))
        .rejects
        .toThrow('Invalid word in seed phrase: invalid1');
    });

    it('should initialize keys from valid seed phrase', async () => {
      // Mock crypto operations
      mockSubtle.importKey.mockResolvedValue('mockKeyMaterial');
      mockSubtle.deriveKey.mockResolvedValue('mockDerivedKey');
      mockSubtle.generateKey.mockResolvedValue({
        publicKey: 'mockPublicKey',
        privateKey: 'mockPrivateKey'
      });
      mockSubtle.exportKey.mockResolvedValue(new Uint8Array(32));
      mockSubtle.encrypt.mockResolvedValue(new Uint8Array(64));

      const keyManager = await KeyManager.getInstance();
      const validSeed = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
      
      await expect(keyManager.initializeFromSeed(validSeed))
        .resolves
        .not.toThrow();

      // Verify crypto operations were called
      expect(mockSubtle.importKey).toHaveBeenCalled();
      expect(mockSubtle.deriveKey).toHaveBeenCalled();
      expect(mockSubtle.generateKey).toHaveBeenCalled();
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', async () => {
      // Mock crypto operations
      const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      mockGetRandomValues.mockImplementation(() => mockIv);
      
      const mockEncrypted = new Uint8Array([20, 21, 22, 23, 24]);
      mockSubtle.encrypt.mockResolvedValue(mockEncrypted);
      
      const mockDecrypted = JSON.stringify({ test: 'data' });
      mockSubtle.decrypt.mockImplementation(() => {
        return new TextEncoder().encode(mockDecrypted);
      });

      const keyManager = await KeyManager.getInstance();
      
      // Initialize with mock keys
      mockSubtle.importKey.mockResolvedValue('mockKeyMaterial');
      mockSubtle.deriveKey.mockResolvedValue('mockDerivedKey');
      mockSubtle.generateKey.mockResolvedValue({
        publicKey: 'mockPublicKey',
        privateKey: 'mockPrivateKey'
      });
      mockSubtle.exportKey.mockResolvedValue(new Uint8Array(32));
      
      await keyManager.initializeFromSeed('abandon ability able about above absent absorb abstract absurd abuse access accident');

      const testData = { test: 'data' };
      const encrypted = await keyManager.encrypt(testData);

      expect(encrypted).toEqual({
        version: 1,
        iv: Array.from(mockIv),
        ciphertext: Array.from(mockEncrypted),
        metadata: expect.objectContaining({
          timestamp: expect.any(Number),
          type: 'unknown',
          deviceId: expect.any(String)
        })
      });

      const decrypted = await keyManager.decrypt(encrypted);
      expect(decrypted).toEqual(testData);
    });

    it('should throw error when encrypting without initialization', async () => {
      const keyManager = await KeyManager.getInstance();
      await expect(keyManager.encrypt({ test: 'data' }))
        .rejects
        .toThrow('Encryption keys not initialized');
    });

    it('should throw error when decrypting without initialization', async () => {
      const keyManager = await KeyManager.getInstance();
      const mockEncrypted = {
        version: 1,
        iv: [1, 2, 3],
        ciphertext: [4, 5, 6],
        metadata: {
          timestamp: Date.now(),
          type: 'test',
          deviceId: 'test-device'
        }
      };

      await expect(keyManager.decrypt(mockEncrypted))
        .rejects
        .toThrow('Decryption keys not initialized');
    });
  });
});
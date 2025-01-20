import { Crypto } from '../../src/crypto';

describe('Crypto', () => {
  let cryptoInstance: Crypto;
  const testPassword = 'test-password';
  const testData = 'test-data';
  let mockSubtle: any;
  let mockCryptoObj: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup crypto mocks
    const mockKey = {} as CryptoKey;
    mockSubtle = {
      importKey: jest.fn().mockResolvedValue(mockKey),
      deriveKey: jest.fn().mockResolvedValue(mockKey),
      encrypt: jest.fn().mockImplementation(async (_, __, data) => {
        return new Uint8Array([...new TextEncoder().encode(data.toString())]);
      }),
      decrypt: jest.fn().mockImplementation(async (_, __, data) => {
        return new TextEncoder().encode(testData);
      })
    };

    mockCryptoObj = {
      subtle: mockSubtle,
      getRandomValues: jest.fn().mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      })
    };

    // Mock the global crypto object
    Object.defineProperty(global, 'crypto', {
      value: mockCryptoObj,
      writable: true
    });

    cryptoInstance = new Crypto();
    await cryptoInstance.initialize(testPassword);
  });

  it('should initialize with password', async () => {
    expect(mockSubtle.importKey).toHaveBeenCalledWith(
      'raw',
      expect.any(Uint8Array),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    expect(mockSubtle.deriveKey).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'PBKDF2',
        iterations: 100000,
        hash: 'SHA-256'
      }),
      expect.any(Object),
      expect.objectContaining({
        name: 'AES-GCM',
        length: 256
      }),
      false,
      ['encrypt', 'decrypt']
    );
  });

  it('should encrypt data', async () => {
    const encrypted = await cryptoInstance.encrypt(testData);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');
    expect(mockSubtle.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'AES-GCM'
      }),
      expect.any(Object),
      expect.any(Uint8Array)
    );
  });

  it('should decrypt data', async () => {
    const encrypted = await cryptoInstance.encrypt(testData);
    const decrypted = await cryptoInstance.decrypt(encrypted);
    expect(decrypted).toBe(testData);
    expect(mockSubtle.decrypt).toHaveBeenCalled();
  });

  it('should generate different ciphertexts for same plaintext', async () => {
    const encrypted1 = await cryptoInstance.encrypt(testData);
    const encrypted2 = await cryptoInstance.encrypt(testData);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw error when not initialized', async () => {
    const uninitializedCrypto = new Crypto();
    await expect(uninitializedCrypto.encrypt(testData)).rejects.toThrow('Crypto not initialized');
    await expect(uninitializedCrypto.decrypt('some-data')).rejects.toThrow('Crypto not initialized');
  });
});

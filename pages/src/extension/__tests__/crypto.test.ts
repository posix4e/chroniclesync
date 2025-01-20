import { encryptData, decryptData } from '../crypto';

describe('Crypto', () => {
  interface MockCrypto {
    subtle: MockSubtle;
    getRandomValues: jest.Mock;
  }

  interface MockSubtle {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
    importKey: jest.Mock;
    deriveKey: jest.Mock;
  }

  let mockCrypto: MockCrypto;
  let mockSubtle: MockSubtle;

  beforeEach(() => {
    mockSubtle = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      importKey: jest.fn(),
      deriveKey: jest.fn(),
    };

    mockCrypto = {
      subtle: mockSubtle,
      getRandomValues: jest.fn(),
    };

    (global as { crypto: MockCrypto }).crypto = mockCrypto;
  });

  it('should encrypt data', async () => {
    mockSubtle.importKey.mockResolvedValue('mockKey');
    mockSubtle.encrypt.mockResolvedValue(new ArrayBuffer(8));
    mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(8));

    const result = await encryptData('testPassword', 'testData');
    expect(result).toBeDefined();
    expect(mockSubtle.importKey).toHaveBeenCalled();
    expect(mockSubtle.encrypt).toHaveBeenCalled();
  });

  it('should decrypt data', async () => {
    mockSubtle.importKey.mockResolvedValue('mockKey');
    mockSubtle.decrypt.mockResolvedValue(new TextEncoder().encode('testData'));

    const result = await decryptData('testPassword', 'encryptedData');
    expect(result).toBeDefined();
    expect(mockSubtle.importKey).toHaveBeenCalled();
    expect(mockSubtle.decrypt).toHaveBeenCalled();
  });
});
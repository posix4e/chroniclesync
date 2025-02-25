import { EncryptionService } from '../src/services/Encryption';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  const testSeed = 'test seed phrase for encryption testing';
  const testData = 'Hello, World!';

  beforeEach(async () => {
    encryptionService = new EncryptionService();
    await encryptionService.initializeFromSeed(testSeed);
  });

  it('should encrypt and decrypt data correctly', async () => {
    const encrypted = await encryptionService.encrypt(testData);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();

    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(testData);
  });

  it('should encrypt history items', async () => {
    const url = 'https://example.com';
    const title = 'Example Website';

    const encrypted = await encryptionService.encryptHistoryItem(url, title);
    expect(encrypted).toHaveProperty('encryptedUrl');
    expect(encrypted).toHaveProperty('encryptedTitle');

    const decrypted = await encryptionService.decryptHistoryItem(
      encrypted.encryptedUrl,
      encrypted.encryptedTitle
    );

    expect(decrypted.url).toBe(url);
    expect(decrypted.title).toBe(title);
  });

  it('should throw error when not initialized', async () => {
    const newService = new EncryptionService();
    await expect(newService.encrypt(testData)).rejects.toThrow('Encryption key not initialized');
  });

  it('should generate different ciphertexts for same input', async () => {
    const encrypted1 = await encryptionService.encrypt(testData);
    const encrypted2 = await encryptionService.encrypt(testData);

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);

    const decrypted1 = await encryptionService.decrypt(encrypted1);
    const decrypted2 = await encryptionService.decrypt(encrypted2);

    expect(decrypted1).toBe(testData);
    expect(decrypted2).toBe(testData);
  });

  it('should handle empty strings', async () => {
    const emptyString = '';
    const encrypted = await encryptionService.encrypt(emptyString);
    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(emptyString);
  });

  it('should handle special characters', async () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const encrypted = await encryptionService.encrypt(specialChars);
    const decrypted = await encryptionService.decrypt(encrypted);
    expect(decrypted).toBe(specialChars);
  });
});
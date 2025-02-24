import { EncryptionService } from '../src/services/EncryptionService';

describe('EncryptionService', () => {
  const testMnemonic = 'test test test test test test test test test test test junk';
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    encryptionService = new EncryptionService(testMnemonic);
  });

  it('should encrypt and decrypt data correctly', async () => {
    const testData = 'Hello, World!';
    const encrypted = await encryptionService.encrypt(testData);

    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(typeof encrypted.ciphertext).toBe('string');
    expect(typeof encrypted.iv).toBe('string');

    const decrypted = await encryptionService.decrypt(encrypted.ciphertext, encrypted.iv);
    expect(decrypted).toBe(testData);
  });

  it('should generate unique IVs for each encryption', async () => {
    const testData = 'Test data';
    const encrypted1 = await encryptionService.encrypt(testData);
    const encrypted2 = await encryptionService.encrypt(testData);

    expect(encrypted1.iv).not.toBe(encrypted2.iv);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
  });

  it('should handle empty strings', async () => {
    const testData = '';
    const encrypted = await encryptionService.encrypt(testData);
    const decrypted = await encryptionService.decrypt(encrypted.ciphertext, encrypted.iv);

    expect(decrypted).toBe(testData);
  });

  it('should handle special characters', async () => {
    const testData = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const encrypted = await encryptionService.encrypt(testData);
    const decrypted = await encryptionService.decrypt(encrypted.ciphertext, encrypted.iv);

    expect(decrypted).toBe(testData);
  });

  it('should handle long strings', async () => {
    const testData = 'a'.repeat(10000);
    const encrypted = await encryptionService.encrypt(testData);
    const decrypted = await encryptionService.decrypt(encrypted.ciphertext, encrypted.iv);

    expect(decrypted).toBe(testData);
  });

  it('should fail with invalid IV', async () => {
    const testData = 'Test data';
    const encrypted = await encryptionService.encrypt(testData);

    await expect(
      encryptionService.decrypt(encrypted.ciphertext, 'invalid_iv')
    ).rejects.toThrow();
  });

  it('should fail with invalid ciphertext', async () => {
    const testData = 'Test data';
    const encrypted = await encryptionService.encrypt(testData);

    await expect(
      encryptionService.decrypt('invalid_ciphertext', encrypted.iv)
    ).rejects.toThrow();
  });
});
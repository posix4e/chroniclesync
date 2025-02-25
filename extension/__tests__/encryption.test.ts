import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../src/services/EncryptionService';
import { Settings } from '../src/settings/Settings';
import { vi } from 'vitest';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  let settings: Settings;

  beforeEach(async () => {
    // Mock Settings class
    settings = {
      getMnemonic: vi.fn().mockResolvedValue('test test test test test test test test test test test test test test test test test test test test test test test test')
    } as unknown as Settings;

    encryptionService = new EncryptionService(settings);
    await encryptionService.init();
  });

  it('should encrypt and decrypt data correctly', async () => {
    const testData = {
      url: 'https://example.com',
      title: 'Example Website',
      platform: 'Win32',
      browserName: 'Chrome'
    };

    const { ciphertext, iv } = await encryptionService.encrypt(JSON.stringify(testData));
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();

    const decrypted = await encryptionService.decrypt(ciphertext, iv);
    const decryptedData = JSON.parse(decrypted);

    expect(decryptedData).toEqual(testData);
  });

  it('should generate different IVs for each encryption', async () => {
    const testData = 'test data';
    const { iv: iv1 } = await encryptionService.encrypt(testData);
    const { iv: iv2 } = await encryptionService.encrypt(testData);

    expect(iv1).not.toEqual(iv2);
  });

  it('should fail to decrypt with wrong IV', async () => {
    const testData = 'test data';
    const { ciphertext } = await encryptionService.encrypt(testData);
    const wrongIv = btoa('wrong iv data here');

    await expect(encryptionService.decrypt(ciphertext, wrongIv)).rejects.toThrow();
  });

  it('should fail to decrypt with wrong ciphertext', async () => {
    const testData = 'test data';
    const { iv } = await encryptionService.encrypt(testData);
    const wrongCiphertext = btoa('wrong ciphertext data');

    await expect(encryptionService.decrypt(wrongCiphertext, iv)).rejects.toThrow();
  });

  it('should fail to initialize without mnemonic', async () => {
    const emptySettings = {
      getMnemonic: vi.fn().mockResolvedValue('')
    } as unknown as Settings;

    const service = new EncryptionService(emptySettings);
    await expect(service.init()).rejects.toThrow('Mnemonic not found');
  });
});
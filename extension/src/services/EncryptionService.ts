import { Buffer } from 'buffer';
import { pbkdf2Sync, randomBytes } from 'crypto';

export class EncryptionService {
  private readonly key: CryptoKey;
  private static readonly SALT = 'chroniclesync_v1';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly ITERATIONS = 100000;

  private static async createKey(mnemonic: string): Promise<CryptoKey> {
    // Derive encryption key from mnemonic using PBKDF2
    const derivedKey = pbkdf2Sync(
      mnemonic,
      EncryptionService.SALT,
      EncryptionService.ITERATIONS,
      EncryptionService.KEY_LENGTH,
      'sha256'
    );

    // Import the key for use with Web Crypto API
    return await crypto.subtle.importKey(
      'raw',
      derivedKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async create(mnemonic: string): Promise<EncryptionService> {
    const key = await EncryptionService.createKey(mnemonic);
    return new EncryptionService(key);
  }

  private constructor(key: CryptoKey) {
    this.key = key;
  }

  async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.key,
      encodedData
    );

    return {
      ciphertext: Buffer.from(encryptedData).toString('base64'),
      iv: Buffer.from(iv).toString('base64')
    };
  }

  async decrypt(ciphertext: string, iv: string): Promise<string> {
    const encryptedData = Buffer.from(ciphertext, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      this.key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  }
}
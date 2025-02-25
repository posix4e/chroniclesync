import { Buffer } from 'buffer';

interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded
}

export class EncryptionService {
  private key: CryptoKey | null = null;
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly saltLength = 32;

  async initializeFromSeed(seed: string): Promise<void> {
    try {
      const encoder = new TextEncoder();
      const seedBuffer = encoder.encode(seed);
      
      // Use HKDF to derive a key from the seed
      const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        seedBuffer,
        'HKDF',
        false,
        ['deriveBits', 'deriveKey']
      );

      this.key = await crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: salt,
          info: encoder.encode('ChronicleSync_Key'),
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize encryption key: ${message}`);
    }
  }

  private assertKeyInitialized(): void {
    if (!this.key) {
      throw new Error('Encryption key not initialized. Call initializeFromSeed first.');
    }
  }

  async encrypt(data: string): Promise<EncryptedData> {
    this.assertKeyInitialized();

    try {
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        this.key!,
        plaintext
      );

      return {
        ciphertext: Buffer.from(ciphertext).toString('base64'),
        iv: Buffer.from(iv).toString('base64'),
        tag: '', // AES-GCM combines the tag with ciphertext
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    this.assertKeyInitialized();

    try {
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        this.key!,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Decryption failed: ${message}`);
    }
  }

  async encryptHistoryItem(url: string, title: string): Promise<{
    encryptedUrl: EncryptedData;
    encryptedTitle: EncryptedData;
  }> {
    const [encryptedUrl, encryptedTitle] = await Promise.all([
      this.encrypt(url),
      this.encrypt(title),
    ]);

    return {
      encryptedUrl,
      encryptedTitle,
    };
  }

  async decryptHistoryItem(
    encryptedUrl: EncryptedData,
    encryptedTitle: EncryptedData
  ): Promise<{
    url: string;
    title: string;
  }> {
    const [url, title] = await Promise.all([
      this.decrypt(encryptedUrl),
      this.decrypt(encryptedTitle),
    ]);

    return {
      url,
      title,
    };
  }
}
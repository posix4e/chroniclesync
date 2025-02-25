import { Settings } from '../settings/Settings';

export class EncryptionService {
  private settings: Settings;
  private encryptionKey: CryptoKey | null = null;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  async init(): Promise<void> {
    const mnemonic = await this.settings.getMnemonic();
    if (!mnemonic) {
      throw new Error('Mnemonic not found');
    }

    // Derive encryption key from mnemonic
    const encoder = new TextEncoder();
    const mnemonicData = encoder.encode(mnemonic);
    const keyMaterial = await crypto.subtle.digest('SHA-256', mnemonicData);
    
    this.encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey,
      encodedData
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  async decrypt(ciphertext: string, iv: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const decoder = new TextDecoder();
    const decodedCiphertext = this.base64ToArrayBuffer(ciphertext);
    const decodedIv = this.base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: decodedIv
      },
      this.encryptionKey,
      decodedCiphertext
    );

    return decoder.decode(decrypted);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
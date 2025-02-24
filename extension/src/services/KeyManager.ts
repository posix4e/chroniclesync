import { wordList } from '../../bip39-wordlist';

export interface KeyMaterial {
  masterKey: CryptoKey;
  dataKey: CryptoKey;
  sharingKey: CryptoKeyPair;
}

export interface EncryptedData {
  version: number;
  iv: number[];
  ciphertext: number[];
  metadata: {
    timestamp: number;
    type: string;
    deviceId: string;
  };
}

export class KeyManager {
  private static instance: KeyManager | null = null;
  private keys: KeyMaterial | null = null;
  private deviceId: string;

  private constructor() {
    // Generate a stable device ID
    this.deviceId = this.getOrCreateDeviceId();
  }

  static async getInstance(): Promise<KeyManager> {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  private getOrCreateDeviceId(): string {
    const stored = localStorage.getItem('deviceId');
    if (stored) return stored;
    
    const newId = crypto.randomUUID();
    localStorage.setItem('deviceId', newId);
    return newId;
  }

  async initializeFromSeed(seedPhrase: string): Promise<void> {
    // Validate seed phrase
    const words = seedPhrase.toLowerCase().trim().split(' ');
    if (words.length !== 12) {
      throw new Error('Seed phrase must be 12 words');
    }
    
    for (const word of words) {
      if (!wordList.includes(word)) {
        throw new Error(`Invalid word in seed phrase: ${word}`);
      }
    }

    // Convert seed phrase to key material
    const encoder = new TextEncoder();
    const seedData = encoder.encode(seedPhrase);
    
    // Generate master key using PBKDF2
    const masterKeyMaterial = await crypto.subtle.importKey(
      'raw',
      seedData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive master key
    const masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ChronicleSync_MasterKey'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      masterKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Derive data encryption key
    const dataKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ChronicleSync_DataKey'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      masterKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Generate key pair for sharing
    const sharingKey = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.keys = {
      masterKey,
      dataKey,
      sharingKey
    };

    // Store encrypted master key
    await this.persistEncryptedMasterKey();
  }

  private async persistEncryptedMasterKey(): Promise<void> {
    if (!this.keys?.masterKey) throw new Error('Master key not initialized');

    // Export master key
    const masterKeyData = await crypto.subtle.exportKey(
      'raw',
      this.keys.masterKey
    );

    // Generate device key from hardware/browser info
    const deviceKeyMaterial = await this.getDeviceBindingKey();
    
    // Encrypt master key with device key
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      deviceKeyMaterial,
      masterKeyData
    );

    // Store encrypted key
    const storage = {
      version: 1,
      iv: Array.from(iv),
      encryptedKey: Array.from(new Uint8Array(encryptedKey))
    };

    localStorage.setItem('encryptedMasterKey', JSON.stringify(storage));
  }

  private async getDeviceBindingKey(): Promise<CryptoKey> {
    // Use device-specific info to derive a key
    const deviceInfo = [
      navigator.userAgent,
      this.deviceId,
      // Add more stable device identifiers here
    ].join('|');

    const encoder = new TextEncoder();
    const deviceData = encoder.encode(deviceInfo);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      deviceData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('ChronicleSync_DeviceKey'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: Record<string, unknown>): Promise<EncryptedData> {
    if (!this.keys?.dataKey) {
      throw new Error('Encryption keys not initialized');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.keys.dataKey,
      encoder.encode(JSON.stringify(data))
    );

    return {
      version: 1,
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
      metadata: {
        timestamp: Date.now(),
        type: data.type || 'unknown',
        deviceId: this.deviceId
      }
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<Record<string, unknown>> {
    if (!this.keys?.dataKey) {
      throw new Error('Decryption keys not initialized');
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encryptedData.iv)
      },
      this.keys.dataKey,
      new Uint8Array(encryptedData.ciphertext)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  async generateSeedPhrase(): Promise<string> {
    // Generate 128 bits of entropy (for 12 words)
    const entropy = crypto.getRandomValues(new Uint8Array(16));
    
    // Convert to binary string
    const bits = Array.from(entropy)
      .map(byte => byte.toString(2).padStart(8, '0'))
      .join('');
    
    // Split into 11-bit chunks (12 words * 11 bits = 132 bits)
    const chunks: string[] = [];
    for (let i = 0; i < 12; i++) {
      chunks.push(bits.slice(i * 11, (i + 1) * 11));
    }
    
    // Convert chunks to indices and map to words
    return chunks
      .map(binary => parseInt(binary, 2) % 2048)
      .map(index => wordList[index])
      .join(' ');
  }
}
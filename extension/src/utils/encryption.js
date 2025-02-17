import { Buffer } from 'buffer';
import { HDKey } from '@scure/bip32';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_VERSION = 1;
const KEY_PATH = 'm/44\'/0\'/0\'/0/0'; // BIP32 path for key derivation

export class EncryptionManager {
  constructor(clientId) {
    this.clientId = clientId;
    this.masterKey = null;
    this.encryptionKey = null;
  }

  async initialize() {
    if (!this.masterKey) {
      // Generate a deterministic seed from the client ID
      // First create a buffer of 32 bytes (256 bits) filled with a repeating pattern based on client ID
      const baseBuffer = Buffer.from(this.clientId);
      const seed = Buffer.alloc(32); // 256 bits as recommended
      
      // Fill the seed buffer with repeating pattern of the client ID
      for (let i = 0; i < seed.length; i++) {
        seed[i] = baseBuffer[i % baseBuffer.length];
      }
      
      this.masterKey = HDKey.fromMasterSeed(seed);
      
      // Derive encryption key using BIP32
      const derivedKey = this.masterKey.derive(KEY_PATH);
      this.encryptionKey = derivedKey.privateKey;
    }
  }

  async encrypt(data) {
    await this.initialize();

    // Generate random IV
    const iv = randomBytes(12);
    
    // Create cipher with AES-GCM
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    // Encrypt data
    const jsonData = JSON.stringify(data);
    const encryptedData = Buffer.concat([
      Buffer.from(cipher.update(jsonData, 'utf8')),
      Buffer.from(cipher.final())
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Return encrypted data with metadata
    return {
      version: ENCRYPTION_VERSION,
      iv: iv.toString('base64'),
      data: encryptedData.toString('base64'),
      tag: authTag.toString('base64')
    };
  }

  async decrypt(encryptedObj) {
    await this.initialize();

    if (encryptedObj.version !== ENCRYPTION_VERSION) {
      throw new Error('Unsupported encryption version');
    }

    // Convert base64 strings back to buffers
    const iv = Buffer.from(encryptedObj.iv, 'base64');
    const encryptedData = Buffer.from(encryptedObj.data, 'base64');
    const authTag = Buffer.from(encryptedObj.tag, 'base64');

    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decryptedData = Buffer.concat([
      Buffer.from(decipher.update(encryptedData)),
      Buffer.from(decipher.final())
    ]);

    return JSON.parse(decryptedData.toString('utf8'));
  }
}
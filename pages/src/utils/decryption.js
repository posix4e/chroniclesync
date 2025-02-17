import { Buffer } from 'buffer';
import { HDKey } from '@scure/bip32';
import { createDecipheriv } from 'crypto';

const ENCRYPTION_VERSION = 1;
const KEY_PATH = 'm/44\'/0\'/0\'/0/0'; // BIP32 path for key derivation

export class DecryptionManager {
  constructor(clientId) {
    this.clientId = clientId;
    this.masterKey = null;
    this.decryptionKey = null;
  }

  async initialize() {
    if (!this.masterKey) {
      // Use client ID as seed for deterministic key generation
      const seed = Buffer.from(this.clientId, 'hex');
      this.masterKey = HDKey.fromMasterSeed(seed);
      
      // Derive decryption key using BIP32
      const derivedKey = this.masterKey.derive(KEY_PATH);
      this.decryptionKey = derivedKey.privateKey;
    }
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
    const decipher = createDecipheriv('aes-256-gcm', this.decryptionKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return JSON.parse(decryptedData.toString('utf8'));
  }
}
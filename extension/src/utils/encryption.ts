import { Buffer } from 'buffer';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const bip32 = BIP32Factory(ecc);

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export class EncryptionManager {
  private key: Buffer;

  constructor(clientId: string) {
    // Derive key from client ID using BIP32
    const seed = Buffer.from(clientId.padEnd(64, '0'));
    const node = bip32.fromSeed(seed);
    this.key = node.privateKey!;
  }

  async encrypt(data: string): Promise<EncryptedData> {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key.slice(0, 32), iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    const data = Buffer.from(encryptedData.data, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.key.slice(0, 32), iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }
}

export const createEncryptionManager = (clientId: string) => {
  return new EncryptionManager(clientId);
};
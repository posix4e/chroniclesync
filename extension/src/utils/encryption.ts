import { Buffer } from 'buffer';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { v4 as uuidv4 } from 'uuid';

const bip32 = BIP32Factory(ecc);

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export class EncryptionManager {
  private clientId: string;
  private masterKey: CryptoKey | null = null;

  constructor() {
    this.clientId = this.getOrCreateClientId();
  }

  getOrCreateClientId(): string {
    const storedId = localStorage.getItem('chroniclesync_client_id');
    if (storedId) {
      return storedId;
    }
    const newId = uuidv4();
    localStorage.setItem('chroniclesync_client_id', newId);
    return newId;
  }

  private async deriveKey(): Promise<CryptoKey> {
    if (this.masterKey) {
      return this.masterKey;
    }

    // Derive a deterministic key from client ID using BIP32
    const seed = Buffer.from(this.clientId, 'utf8');
    const node = bip32.fromSeed(seed);
    const derivedKey = node.privateKey!;

    // Import the derived key for AES-GCM
    this.masterKey = await window.crypto.subtle.importKey(
      'raw',
      derivedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.masterKey;
  }

  async encrypt(data: string): Promise<EncryptedData> {
    const key = await this.deriveKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const tag = encryptedArray.slice(-16);
    const ciphertext = encryptedArray.slice(0, -16);

    return {
      iv: Buffer.from(iv).toString('base64'),
      data: Buffer.from(ciphertext).toString('base64'),
      tag: Buffer.from(tag).toString('base64')
    };
  }

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = await this.deriveKey();
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const data = Buffer.from(encryptedData.data, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    const combined = new Uint8Array(data.length + tag.length);
    combined.set(new Uint8Array(data), 0);
    combined.set(new Uint8Array(tag), data.length);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      combined
    );

    return new TextDecoder().decode(decryptedData);
  }
}
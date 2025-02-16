import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export class HistoryEncryption {
  private key: any;

  constructor(seed: Buffer) {
    this.key = bip32.fromSeed(seed);
  }

  private async encrypt(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use the key's private key for encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey(
      'raw',
      this.key.privateKey!.slice(0, 32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async encryptHistoryItem(item: {
    url: string;
    title: string;
    visitTime: number;
    visitId: string;
    referringVisitId: string;
    transition: string;
    deviceId: string;
    platform: string;
    userAgent: string;
    browserName: string;
    browserVersion: string;
  }) {
    const encryptedUrl = await this.encrypt(item.url);
    const encryptedTitle = await this.encrypt(item.title || '');

    return {
      ...item,
      url: '', // Clear original values
      title: '',
      encryptedUrl,
      encryptedTitle
    };
  }

  async encryptHistoryItems(items: any[]) {
    return Promise.all(items.map(item => this.encryptHistoryItem(item)));
  }
}
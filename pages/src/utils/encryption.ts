import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { HistoryItem } from '../types/history';

const bip32 = BIP32Factory(ecc);

interface EncryptedHistoryItem extends Omit<HistoryItem, 'url' | 'title'> {
  encryptedUrl: string;
  encryptedTitle: string;
  visitId: string; // Required for merging
}

export class HistoryEncryption {
  private key: ReturnType<typeof bip32.fromSeed>;

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

  private async decrypt(encryptedText: string): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await crypto.subtle.importKey(
      'raw',
      this.key.privateKey!.slice(0, 32),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  }

  async encryptHistoryItem(item: HistoryItem): Promise<EncryptedHistoryItem> {
    const encryptedUrl = await this.encrypt(item.url);
    const encryptedTitle = await this.encrypt(item.title);
    const visitId = crypto.randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { url: _url, title: _title, ...rest } = item;
    return {
      ...rest,
      encryptedUrl,
      encryptedTitle,
      visitId
    };
  }

  async decryptHistoryItem(item: EncryptedHistoryItem): Promise<HistoryItem> {
    const url = await this.decrypt(item.encryptedUrl);
    const title = await this.decrypt(item.encryptedTitle);

    return {
      ...item,
      url,
      title
    } as HistoryItem;
  }

  async encryptHistoryItems(items: HistoryItem[]): Promise<EncryptedHistoryItem[]> {
    return Promise.all(items.map(item => this.encryptHistoryItem(item)));
  }

  async decryptHistoryItems(items: EncryptedHistoryItem[]): Promise<HistoryItem[]> {
    return Promise.all(items.map(item => this.decryptHistoryItem(item)));
  }
}
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from 'bip39';

export class EncryptionService {
  static generateMnemonic(): string {
    return generateMnemonic(256); // 24 words for maximum security
  }

  static validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic);
  }

  static async generateClientId(mnemonic: string): Promise<string> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = mnemonicToSeedSync(mnemonic);
    const encoder = new TextEncoder();
    const data = encoder.encode(seed.toString('hex'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return first 32 characters of the hash as the client ID
    return hashHex.substring(0, 32);
  }

  static async deriveEncryptionKey(mnemonic: string): Promise<CryptoKey> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = mnemonicToSeedSync(mnemonic);
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(seed.toString('hex'));
    
    // Import the seed as a key
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive a 256-bit AES-GCM key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('chroniclesync'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
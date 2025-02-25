export class EncryptionService {
  private key: CryptoKey | null = null;

  async init(mnemonic: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(mnemonic),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('chroniclesync'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string): Promise<{ ciphertext: string; iv: string }> {
    if (!this.key) throw new Error('Encryption not initialized');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.key,
      encoder.encode(data)
    );

    return {
      ciphertext: Buffer.from(ciphertext).toString('base64'),
      iv: Buffer.from(iv).toString('base64')
    };
  }

  async decrypt(ciphertext: string, iv: string): Promise<string> {
    if (!this.key) throw new Error('Encryption not initialized');

    const decoder = new TextDecoder();
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: Buffer.from(iv, 'base64')
      },
      this.key,
      Buffer.from(ciphertext, 'base64')
    );

    return decoder.decode(plaintext);
  }
}
export const BIP32Factory = () => ({
  fromSeed: () => ({
    privateKey: new Uint8Array(32)
  })
});

export interface EncryptedData {
  iv: string;
  data: string;
  tag: string;
}

export class DecryptionManager {
  constructor(_clientId: string) {}

  async decrypt(encryptedData: EncryptedData): Promise<string> {
    return 'decrypted-' + encryptedData.data;
  }
}

export const createDecryptionManager = (clientId: string) => {
  return new DecryptionManager(clientId);
};
export const BIP32Factory = () => ({
  fromSeed: () => ({
    privateKey: new Uint8Array(32)
  })
});

export class HistoryEncryption {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_seed: Buffer) { /* not used in mock */ }

  async encryptHistoryItem(item: { url: string; title: string; [key: string]: unknown }) {
    const visitId = 'mock-visit-id';
    const { url, title, ...rest } = item;
    return {
      ...rest,
      encryptedUrl: 'encrypted:' + url,
      encryptedTitle: 'encrypted:' + title,
      visitId
    };
  }

  async decryptHistoryItem(item: { encryptedUrl: string; encryptedTitle: string; [key: string]: unknown }) {
    return {
      ...item,
      url: item.encryptedUrl.replace('encrypted:', ''),
      title: item.encryptedTitle.replace('encrypted:', '')
    };
  }

  async encryptHistoryItems(items: { url: string; title: string; [key: string]: unknown }[]) {
    return Promise.all(items.map(item => this.encryptHistoryItem(item)));
  }

  async decryptHistoryItems(items: { encryptedUrl: string; encryptedTitle: string; [key: string]: unknown }[]) {
    return Promise.all(items.map(item => this.decryptHistoryItem(item)));
  }
}
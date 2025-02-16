import { DecryptionManager } from '../utils/decryption';

interface EncryptedHistoryItem {
  visitTime: number;
  encryptedData: {
    version: number;
    iv: string;
    data: string;
    tag: string;
  };
  visitId: string;
  referringVisitId: string;
  transition: string;
  deviceId: string;
  platform: string;
  userAgent: string;
  browserName: string;
  browserVersion: string;
}

interface DecryptedHistoryItem {
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
}

export class DecryptionService {
  private decryptionManager: DecryptionManager;

  constructor(clientId: string) {
    this.decryptionManager = new DecryptionManager(clientId);
  }

  async decryptHistoryItem(item: EncryptedHistoryItem): Promise<DecryptedHistoryItem> {
    const decryptedData = await this.decryptionManager.decrypt(item.encryptedData);

    return {
      url: decryptedData.url,
      title: decryptedData.title,
      visitTime: item.visitTime,
      visitId: item.visitId,
      referringVisitId: item.referringVisitId,
      transition: item.transition,
      deviceId: item.deviceId,
      platform: item.platform,
      userAgent: item.userAgent,
      browserName: item.browserName,
      browserVersion: item.browserVersion
    };
  }

  async decryptHistoryItems(items: EncryptedHistoryItem[]): Promise<DecryptedHistoryItem[]> {
    return Promise.all(items.map(item => this.decryptHistoryItem(item)));
  }
}
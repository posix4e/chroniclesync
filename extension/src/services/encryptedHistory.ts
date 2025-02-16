import { EncryptionManager } from '../utils/encryption';

interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
}

interface EncryptedHistoryItem {
  visitTime: number;
  encryptedData: {
    version: number;
    iv: string;
    data: string;
    tag: string;
  };
}

export class EncryptedHistoryService {
  private encryptionManager: EncryptionManager;

  constructor(clientId: string) {
    this.encryptionManager = new EncryptionManager(clientId);
  }

  async encryptHistoryItem(item: HistoryItem): Promise<EncryptedHistoryItem> {
    const sensitiveData = {
      url: item.url,
      title: item.title
    };

    const encryptedData = await this.encryptionManager.encrypt(sensitiveData);

    return {
      visitTime: item.visitTime,
      encryptedData
    };
  }

  async decryptHistoryItem(item: EncryptedHistoryItem): Promise<HistoryItem> {
    const decryptedData = await this.encryptionManager.decrypt(item.encryptedData);

    return {
      url: decryptedData.url,
      title: decryptedData.title,
      visitTime: item.visitTime
    };
  }

  async encryptHistoryItems(items: HistoryItem[]): Promise<EncryptedHistoryItem[]> {
    return Promise.all(items.map(item => this.encryptHistoryItem(item)));
  }

  async decryptHistoryItems(items: EncryptedHistoryItem[]): Promise<HistoryItem[]> {
    return Promise.all(items.map(item => this.decryptHistoryItem(item)));
  }
}
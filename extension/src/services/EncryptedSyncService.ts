import { KeyManager, EncryptedData } from './KeyManager';

interface SyncResponse {
  success: boolean;
  error?: string;
  data?: EncryptedData[];
}

export class EncryptedSyncService {
  private static instance: EncryptedSyncService | null = null;
  private keyManager: KeyManager | null = null;
  private readonly apiBase: string;

  private constructor() {
    // Use the appropriate API endpoint
    this.apiBase = process.env.API_URL || 'https://api.chroniclesync.com';
  }

  static async getInstance(): Promise<EncryptedSyncService> {
    if (!EncryptedSyncService.instance) {
      EncryptedSyncService.instance = new EncryptedSyncService();
      EncryptedSyncService.instance.keyManager = await KeyManager.getInstance();
    }
    return EncryptedSyncService.instance;
  }

  async syncToServer(data: Record<string, unknown>): Promise<void> {
    if (!this.keyManager) {
      throw new Error('KeyManager not initialized');
    }

    // Encrypt the data
    const encrypted = await this.keyManager.encrypt(data);

    // Send to server
    const response = await fetch(`${this.apiBase}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encryptedData: encrypted,
        metadata: encrypted.metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  async getFromServer(filters?: {
    type?: string;
    fromDate?: number;
    toDate?: number;
  }): Promise<Record<string, unknown>[]> {
    if (!this.keyManager) {
      throw new Error('KeyManager not initialized');
    }

    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.fromDate) params.set('fromDate', filters.fromDate.toString());
    if (filters?.toDate) params.set('toDate', filters.toDate.toString());

    // Fetch encrypted data
    const response = await fetch(
      `${this.apiBase}/sync?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const result: SyncResponse = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch data');
    }

    // Decrypt all records
    const decrypted = await Promise.all(
      result.data.map(encrypted => this.keyManager!.decrypt(encrypted))
    );

    return decrypted;
  }

  async initializeWithSeed(seedPhrase: string): Promise<void> {
    if (!this.keyManager) {
      throw new Error('KeyManager not initialized');
    }
    await this.keyManager.initializeFromSeed(seedPhrase);
  }

  async generateNewSeed(): Promise<string> {
    if (!this.keyManager) {
      throw new Error('KeyManager not initialized');
    }
    return await this.keyManager.generateSeedPhrase();
  }
}
interface SettingsConfig {
  mnemonic: string;
  clientId: string;
  customApiUrl: string | null;
  environment: 'production' | 'staging' | 'custom';
  expirationDays: number;
  syncMode: 'server' | 'p2p';
  iceServerProvider: 'google' | 'twilio' | 'metered' | 'custom';
  customIceServers: string | null;
}

type StorageKeys = keyof SettingsConfig;

export class BackgroundSettings {
  config: SettingsConfig | null = null;
  private readonly PROD_API_URL = 'https://api.chroniclesync.xyz';
  private readonly STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

  // ICE server configurations
  private readonly GOOGLE_ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ];

  private readonly TWILIO_ICE_SERVERS = [
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    }
  ];

  private readonly METERED_ICE_SERVERS = [
    { urls: 'stun:stun.metered.ca:80' },
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'chroniclesync',
      credential: 'chroniclesync2025'
    }
  ];

  private readonly DEFAULT_SETTINGS: SettingsConfig = {
    mnemonic: '',
    clientId: '',
    customApiUrl: null,
    environment: 'production',
    expirationDays: 7,
    syncMode: 'p2p',
    iceServerProvider: 'google',
    customIceServers: null
  };

  async init(): Promise<void> {
    const result = await this.getStorageData();
    this.config = {
      mnemonic: result.mnemonic || this.DEFAULT_SETTINGS.mnemonic,
      clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
      customApiUrl: result.customApiUrl || this.DEFAULT_SETTINGS.customApiUrl,
      environment: result.environment || this.DEFAULT_SETTINGS.environment,
      expirationDays: result.expirationDays || this.DEFAULT_SETTINGS.expirationDays,
      syncMode: result.syncMode || this.DEFAULT_SETTINGS.syncMode,
      iceServerProvider: result.iceServerProvider || this.DEFAULT_SETTINGS.iceServerProvider,
      customIceServers: result.customIceServers || this.DEFAULT_SETTINGS.customIceServers
    };
  }

  private async getStorageData(): Promise<Partial<SettingsConfig>> {
    return new Promise((resolve) => {
      const keys: StorageKeys[] = ['mnemonic', 'clientId', 'customApiUrl', 'environment', 'expirationDays', 'syncMode', 'iceServerProvider', 'customIceServers'];
      chrome.storage.sync.get(keys, (result) => resolve(result as Partial<SettingsConfig>));
    });
  }

  getApiUrl(): string {
    if (!this.config) throw new Error('Settings not initialized');
    
    switch (this.config.environment) {
    case 'production':
      return this.PROD_API_URL;
    case 'staging':
      return this.STAGING_API_URL;
    case 'custom':
      return this.config.customApiUrl || this.PROD_API_URL;
    default:
      return this.PROD_API_URL;
    }
  }
  
  getIceServers(): string {
    if (!this.config) throw new Error('Settings not initialized');
    
    switch (this.config.iceServerProvider) {
    case 'google':
      return JSON.stringify(this.GOOGLE_ICE_SERVERS);
    case 'twilio':
      return JSON.stringify(this.TWILIO_ICE_SERVERS);
    case 'metered':
      return JSON.stringify(this.METERED_ICE_SERVERS);
    case 'custom':
      if (this.config.customIceServers) {
        return this.config.customIceServers;
      }
      // Fall back to Google servers if custom servers are not set
      return JSON.stringify(this.GOOGLE_ICE_SERVERS);
    default:
      return JSON.stringify(this.GOOGLE_ICE_SERVERS);
    }
  }
}
// Add wordList to Window interface
declare global {
  interface Window {
    wordList?: string[];
  }
}

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

export class Settings {
  config: SettingsConfig | null = null;
  private readonly PROD_API_URL = 'https://api.chroniclesync.xyz';
  private readonly STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';
  private bip39WordList: string[] | null = null;
  
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
    try {
      // Try to access the global wordList variable
      if (typeof window.wordList !== 'undefined' && window.wordList) {
        this.bip39WordList = window.wordList;
      } else {
        // Fallback to dynamic import if global variable is not available
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('bip39-wordlist.js');
        script.type = 'text/javascript';
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise<void>((resolve) => {
          script.onload = () => {
            if (window.wordList) {
              this.bip39WordList = window.wordList;
            }
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load wordlist script');
            resolve();
          };
        });
      }
    } catch (error) {
      console.error('Error loading wordlist:', error);
      return;
    }

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

    // Generate initial mnemonic if needed
    if (!this.config.mnemonic || !this.config.clientId) {
      const mnemonic = this.generateMnemonic();
      if (mnemonic) {
        const clientId = await this.generateClientId(mnemonic);
        this.config = {
          ...this.config,
          mnemonic,
          clientId
        };
        await this.handleSave();
      }
    }

    this.render();
    this.setupEventListeners();
  }

  private generateMnemonic(): string | null {
    if (!this.bip39WordList) return null;
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);
    const words = [];
    for (let i = 0; i < 24; i++) {
      const index = Math.floor((entropy[i] / 256) * this.bip39WordList.length);
      words.push(this.bip39WordList[index]);
    }
    return words.join(' ');
  }

  private validateMnemonic(mnemonic: string): boolean {
    if (!this.bip39WordList) return false;
    const words = mnemonic.trim().toLowerCase().split(/\s+/);
    if (words.length !== 24) return false;
    return words.every(word => this.bip39WordList!.includes(word));
  }

  private async generateClientId(mnemonic: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    
    // Use SHA-256 for a full 256-bit hash
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    
    // Convert to base64url encoding (approximately 43 characters)
    // This is much shorter than the 64-character hex string
    const base64 = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, '-')  // Replace + with - (URL safe)
      .replace(/\//g, '_')  // Replace / with _ (URL safe)
      .replace(/=+$/, '');  // Remove trailing = (padding)
    
    return base64; // Full 256-bit security
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

  private render(): void {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const expirationDaysInput = document.getElementById('expirationDays') as HTMLInputElement;
    const syncModeSelect = document.getElementById('syncMode') as HTMLSelectElement;
    const iceServerProviderSelect = document.getElementById('iceServerProvider') as HTMLSelectElement;
    const customIceServersContainer = document.getElementById('customIceServersContainer') as HTMLDivElement;
    const customIceServersInput = document.getElementById('customIceServers') as HTMLTextAreaElement;

    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    expirationDaysInput.value = this.config.expirationDays.toString();
    syncModeSelect.value = this.config.syncMode;
    iceServerProviderSelect.value = this.config.iceServerProvider;
    customIceServersInput.value = this.config.customIceServers || '';
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';
    customIceServersContainer.style.display = this.config.iceServerProvider === 'custom' ? 'block' : 'none';
  }

  private setupEventListeners(): void {
    document.getElementById('saveSettings')?.addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
    document.getElementById('syncMode')?.addEventListener('change', () => this.handleSyncModeChange());
    document.getElementById('iceServerProvider')?.addEventListener('change', () => this.handleIceServerProviderChange());
    document.getElementById('generateMnemonic')?.addEventListener('click', () => this.handleGenerateMnemonic());
    document.getElementById('showMnemonic')?.addEventListener('click', () => this.handleShowMnemonic());
    document.getElementById('mnemonic')?.addEventListener('input', () => this.handleMnemonicInput());
  }

  private async handleMnemonicInput(): Promise<void> {
    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    if (!mnemonicInput || !clientIdInput) return;

    const mnemonic = mnemonicInput.value.trim();
    if (this.validateMnemonic(mnemonic)) {
      const clientId = await this.generateClientId(mnemonic);
      clientIdInput.value = clientId;
      this.config = {
        ...this.config!,
        mnemonic,
        clientId
      };
    } else {
      clientIdInput.value = '';
    }
  }

  private handleShowMnemonic(): void {
    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    if (!mnemonicInput) return;
    mnemonicInput.classList.toggle('hidden');
  }

  private async handleGenerateMnemonic(): Promise<void> {
    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    if (!mnemonicInput) return;

    const mnemonic = this.generateMnemonic();
    if (mnemonic) {
      mnemonicInput.value = mnemonic;
      await this.handleMnemonicInput();
      await this.handleSave();
    }
  }

  private handleEnvironmentChange(): void {
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    customUrlContainer.style.display = environmentSelect.value === 'custom' ? 'block' : 'none';
  }

  private handleSyncModeChange(): void {
    // No longer need to toggle p2pSettingsContainer visibility
  }
  
  private handleIceServerProviderChange(): void {
    const iceServerProviderSelect = document.getElementById('iceServerProvider') as HTMLSelectElement;
    const customIceServersContainer = document.getElementById('customIceServersContainer') as HTMLDivElement;
    customIceServersContainer.style.display = iceServerProviderSelect.value === 'custom' ? 'block' : 'none';
  }

  private async handleSave(event?: Event): Promise<void> {
    event?.preventDefault();

    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const expirationDaysInput = document.getElementById('expirationDays') as HTMLInputElement;
    const syncModeSelect = document.getElementById('syncMode') as HTMLSelectElement;
    const iceServerProviderSelect = document.getElementById('iceServerProvider') as HTMLSelectElement;
    const customIceServersInput = document.getElementById('customIceServers') as HTMLTextAreaElement;

    const mnemonic = mnemonicInput.value.trim();
    if (!this.validateMnemonic(mnemonic)) {
      this.showMessage('Please enter a valid 24-word mnemonic phrase', 'error');
      return;
    }

    const expirationDays = parseInt(expirationDaysInput.value);
    if (isNaN(expirationDays) || expirationDays < 1) {
      this.showMessage('Please enter a valid number of days for expiration (minimum 1)', 'error');
      return;
    }

    const clientId = await this.generateClientId(mnemonic);
    clientIdInput.value = clientId;

    const newConfig: SettingsConfig = {
      mnemonic,
      clientId,
      environment: environmentSelect.value as SettingsConfig['environment'],
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null,
      expirationDays,
      syncMode: syncModeSelect.value as SettingsConfig['syncMode'],
      iceServerProvider: iceServerProviderSelect.value as SettingsConfig['iceServerProvider'],
      customIceServers: iceServerProviderSelect.value === 'custom' ? 
        customIceServersInput.value.trim() : null
    };

    if (newConfig.environment === 'custom' && !newConfig.customApiUrl) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

    if (newConfig.iceServerProvider === 'custom' && !newConfig.customIceServers) {
      this.showMessage('Custom ICE servers are required when using custom ICE server provider', 'error');
      return;
    }
    
    // Validate custom ICE servers JSON if provided
    if (newConfig.customIceServers) {
      try {
        JSON.parse(newConfig.customIceServers);
      } catch {
        this.showMessage('Custom ICE servers must be valid JSON', 'error');
        return;
      }
    }

    await new Promise<void>((resolve) => {
      chrome.storage.sync.set(newConfig, () => resolve());
    });

    this.config = newConfig;
    this.showMessage('Settings saved successfully!', 'success');
  }

  private async handleReset(): Promise<void> {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const mnemonic = this.generateMnemonic();
      if (mnemonic) {
        const clientId = await this.generateClientId(mnemonic);
        this.config = {
          ...this.DEFAULT_SETTINGS,
          mnemonic,
          clientId
        };
        this.render();
        await this.handleSave();
      }
    }
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    const status = document.createElement('div');
    status.className = `status-message ${type}`;
    status.textContent = text;
    document.querySelector('.settings-actions')?.appendChild(status);

    setTimeout(() => {
      status.remove();
    }, 3000);
  }
}
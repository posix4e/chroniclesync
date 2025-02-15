import { EncryptionService } from '../services/encryption';

interface SettingsConfig {
  clientId: string;
  mnemonic: string;
  customApiUrl: string | null;
  environment: 'production' | 'staging' | 'custom';
}

type StorageKeys = keyof SettingsConfig;

export class Settings {
  private config: SettingsConfig | null = null;
  private readonly PROD_API_URL = 'https://api.chroniclesync.xyz';
  private readonly STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

  private readonly DEFAULT_SETTINGS: SettingsConfig = {
    clientId: '',
    mnemonic: '',
    customApiUrl: null,
    environment: 'production'
  };

  async init(): Promise<void> {
    const result = await this.getStorageData();
    this.config = {
      clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
      mnemonic: result.mnemonic || this.DEFAULT_SETTINGS.mnemonic,
      customApiUrl: result.customApiUrl || this.DEFAULT_SETTINGS.customApiUrl,
      environment: result.environment || this.DEFAULT_SETTINGS.environment
    };
    this.render();
    this.setupEventListeners();
  }

  private async getStorageData(): Promise<Partial<SettingsConfig>> {
    return new Promise((resolve) => {
      const keys: StorageKeys[] = ['clientId', 'mnemonic', 'customApiUrl', 'environment'];
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

  private render(): void {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic') as HTMLInputElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const generateKeysBtn = document.getElementById('generateKeys') as HTMLButtonElement;

    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    clientIdInput.readOnly = true;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';
  }

  private setupEventListeners(): void {
    document.getElementById('saveSettings')?.addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
    document.getElementById('generateKeys')?.addEventListener('click', () => this.handleGenerateKeys());
    document.getElementById('generateMnemonic')?.addEventListener('click', () => this.handleGenerateMnemonic());
  }

  private handleEnvironmentChange(): void {
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    customUrlContainer.style.display = environmentSelect.value === 'custom' ? 'block' : 'none';
  }

  private handleGenerateMnemonic(): void {
    const mnemonicInput = document.getElementById('mnemonic') as HTMLInputElement;
    mnemonicInput.value = EncryptionService.generateMnemonic();
  }

  private async handleGenerateKeys(): Promise<void> {
    const mnemonicInput = document.getElementById('mnemonic') as HTMLInputElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const keyStatus = document.querySelector('.key-status') as HTMLDivElement;
    const mnemonic = mnemonicInput.value.trim();

    try {
      if (!EncryptionService.validateMnemonic(mnemonic)) {
        keyStatus.textContent = 'Invalid mnemonic phrase';
        keyStatus.className = 'key-status error';
        return;
      }

      const clientId = await EncryptionService.generateClientId(mnemonic);
      clientIdInput.value = clientId;

      // Also derive the encryption key and store it securely
      const encryptionKey = await EncryptionService.deriveEncryptionKey(mnemonic);
      // The encryption key will be used for encrypting/decrypting data

      keyStatus.textContent = 'Keys generated successfully!';
      keyStatus.className = 'key-status success';
      this.showMessage('Keys generated successfully!', 'success');
    } catch (error) {
      keyStatus.textContent = 'Error generating keys: ' + (error as Error).message;
      keyStatus.className = 'key-status error';
      this.showMessage('Error generating keys: ' + (error as Error).message, 'error');
    }
  }

  private async handleSave(event?: Event): Promise<void> {
    event?.preventDefault();

    const mnemonicInput = document.getElementById('mnemonic') as HTMLInputElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;

    const mnemonic = mnemonicInput.value.trim();
    if (!EncryptionService.validateMnemonic(mnemonic)) {
      this.showMessage('Invalid mnemonic phrase', 'error');
      return;
    }

    const newConfig: SettingsConfig = {
      mnemonic,
      clientId: clientIdInput.value.trim(),
      environment: environmentSelect.value as SettingsConfig['environment'],
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null
    };

    if (newConfig.environment === 'custom' && !newConfig.customApiUrl) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

    await new Promise<void>((resolve) => {
      chrome.storage.sync.set(newConfig, () => resolve());
    });

    this.config = newConfig;
    this.showMessage('Settings saved successfully!', 'success');
  }

  private handleReset(): void {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      this.handleSave();
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
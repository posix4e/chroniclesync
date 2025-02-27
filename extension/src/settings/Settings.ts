import { SummarySettings, DEFAULT_SUMMARY_SETTINGS } from '../types/summary';

interface SettingsConfig {
  mnemonic: string;
  clientId: string;
  customApiUrl: string | null;
  environment: 'production' | 'staging' | 'custom';
  expirationDays: number;
  summarySettings: SummarySettings;
}

type StorageKeys = keyof SettingsConfig;

export class Settings {
  config: SettingsConfig | null = null;
  private readonly PROD_API_URL = 'https://api.chroniclesync.xyz';
  private readonly STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';
  private bip39WordList: string[] | null = null;

  private readonly DEFAULT_SETTINGS: SettingsConfig = {
    mnemonic: '',
    clientId: '',
    customApiUrl: null,
    environment: 'production',
    expirationDays: 7,
    summarySettings: DEFAULT_SUMMARY_SETTINGS
  };

  async init(): Promise<void> {
    try {
      const { wordList } = await import('../../bip39-wordlist.js');
      this.bip39WordList = wordList;
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
      summarySettings: result.summarySettings || this.DEFAULT_SETTINGS.summarySettings
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
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async getStorageData(): Promise<Partial<SettingsConfig>> {
    return new Promise((resolve) => {
      const keys: StorageKeys[] = ['mnemonic', 'clientId', 'customApiUrl', 'environment', 'expirationDays', 'summarySettings'];
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

    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const expirationDaysInput = document.getElementById('expirationDays') as HTMLInputElement;

    // Summary settings
    const summaryEnabled = document.getElementById('summaryEnabled') as HTMLInputElement;
    const summaryLength = document.getElementById('summaryLength') as HTMLInputElement;
    const minSentences = document.getElementById('minSentences') as HTMLInputElement;
    const maxSentences = document.getElementById('maxSentences') as HTMLInputElement;
    const autoSummarize = document.getElementById('autoSummarize') as HTMLInputElement;
    const priorityHeadlines = document.getElementById('priorityHeadlines') as HTMLInputElement;
    const priorityLists = document.getElementById('priorityLists') as HTMLInputElement;
    const priorityQuotes = document.getElementById('priorityQuotes') as HTMLInputElement;

    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    expirationDaysInput.value = this.config.expirationDays.toString();
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';

    // Set summary settings
    summaryEnabled.checked = this.config.summarySettings.enabled;
    summaryLength.value = this.config.summarySettings.summaryLength.toString();
    minSentences.value = this.config.summarySettings.minSentences.toString();
    maxSentences.value = this.config.summarySettings.maxSentences.toString();
    autoSummarize.checked = this.config.summarySettings.autoSummarize;
    priorityHeadlines.checked = this.config.summarySettings.contentPriority.headlines;
    priorityLists.checked = this.config.summarySettings.contentPriority.lists;
    priorityQuotes.checked = this.config.summarySettings.contentPriority.quotes;
  }

  private setupEventListeners(): void {
    document.getElementById('saveSettings')?.addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
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

  private async handleSave(event?: Event): Promise<void> {
    event?.preventDefault();

    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const expirationDaysInput = document.getElementById('expirationDays') as HTMLInputElement;

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

    // Get summary settings
    const summaryEnabled = (document.getElementById('summaryEnabled') as HTMLInputElement).checked;
    const summaryLength = parseInt((document.getElementById('summaryLength') as HTMLInputElement).value);
    const minSentences = parseInt((document.getElementById('minSentences') as HTMLInputElement).value);
    const maxSentences = parseInt((document.getElementById('maxSentences') as HTMLInputElement).value);
    const autoSummarize = (document.getElementById('autoSummarize') as HTMLInputElement).checked;
    const priorityHeadlines = (document.getElementById('priorityHeadlines') as HTMLInputElement).checked;
    const priorityLists = (document.getElementById('priorityLists') as HTMLInputElement).checked;
    const priorityQuotes = (document.getElementById('priorityQuotes') as HTMLInputElement).checked;

    // Validate summary settings
    if (isNaN(summaryLength) || summaryLength < 10 || summaryLength > 100) {
      this.showMessage('Summary length must be between 10 and 100 words', 'error');
      return;
    }

    if (isNaN(minSentences) || minSentences < 1 || minSentences > 10) {
      this.showMessage('Minimum sentences must be between 1 and 10', 'error');
      return;
    }

    if (isNaN(maxSentences) || maxSentences < 1 || maxSentences > 20) {
      this.showMessage('Maximum sentences must be between 1 and 20', 'error');
      return;
    }

    if (minSentences > maxSentences) {
      this.showMessage('Minimum sentences cannot be greater than maximum sentences', 'error');
      return;
    }

    const newConfig: SettingsConfig = {
      mnemonic,
      clientId,
      environment: environmentSelect.value as SettingsConfig['environment'],
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null,
      expirationDays,
      summarySettings: {
        enabled: summaryEnabled,
        summaryLength,
        minSentences,
        maxSentences,
        autoSummarize,
        contentPriority: {
          headlines: priorityHeadlines,
          lists: priorityLists,
          quotes: priorityQuotes
        },
        modelConfig: this.config!.summarySettings.modelConfig
      }
    };

    if (newConfig.environment === 'custom' && !newConfig.customApiUrl) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

    await new Promise<void>((resolve) => {
      chrome.storage.sync.set(newConfig, () => resolve());
    });

    this.config = newConfig;

    // Notify background script about summary settings change
    chrome.runtime.sendMessage({
      type: 'updateSummarySettings',
      settings: newConfig.summarySettings
    });

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
          clientId,
          summarySettings: DEFAULT_SUMMARY_SETTINGS
        };
        this.render();
        await this.handleSave();

        // Notify background script about summary settings change
        chrome.runtime.sendMessage({
          type: 'updateSummarySettings',
          settings: DEFAULT_SUMMARY_SETTINGS
        });
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
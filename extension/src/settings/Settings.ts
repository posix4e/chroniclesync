import { SummarySettings } from '../types/summary';

interface SettingsConfig {
  mnemonic: string;
  clientId: string;
  customApiUrl: string | null;
  environment: 'production' | 'staging' | 'custom';
  expirationDays: number;
  summary: SummarySettings;
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
    summary: {
      enabled: true,
      summaryLength: 30,
      minSentences: 3,
      maxSentences: 10,
      autoSummarize: true,
      contentPriority: {
        headlines: true,
        lists: true,
        quotes: false
      }
    }
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
      summary: result.summary || this.DEFAULT_SETTINGS.summary
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
      const keys: StorageKeys[] = ['mnemonic', 'clientId', 'customApiUrl', 'environment', 'expirationDays', 'summary'];
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

    // Basic settings
    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    expirationDaysInput.value = this.config.expirationDays.toString();
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';

    // Summarization settings
    const summaryEnabled = document.getElementById('summaryEnabled') as HTMLInputElement;
    const autoSummarize = document.getElementById('autoSummarize') as HTMLInputElement;
    const summaryLength = document.getElementById('summaryLength') as HTMLInputElement;
    const minSentences = document.getElementById('minSentences') as HTMLInputElement;
    const maxSentences = document.getElementById('maxSentences') as HTMLInputElement;
    const priorityHeadlines = document.getElementById('priorityHeadlines') as HTMLInputElement;
    const priorityLists = document.getElementById('priorityLists') as HTMLInputElement;
    const priorityQuotes = document.getElementById('priorityQuotes') as HTMLInputElement;
    const modelUrl = document.getElementById('modelUrl') as HTMLInputElement;
    const inputLength = document.getElementById('inputLength') as HTMLInputElement;
    const outputLength = document.getElementById('outputLength') as HTMLInputElement;
    const threshold = document.getElementById('threshold') as HTMLInputElement;

    if (this.config.summary) {
      summaryEnabled.checked = this.config.summary.enabled;
      autoSummarize.checked = this.config.summary.autoSummarize;
      summaryLength.value = this.config.summary.summaryLength.toString();
      minSentences.value = this.config.summary.minSentences.toString();
      maxSentences.value = this.config.summary.maxSentences.toString();
      priorityHeadlines.checked = this.config.summary.contentPriority.headlines;
      priorityLists.checked = this.config.summary.contentPriority.lists;
      priorityQuotes.checked = this.config.summary.contentPriority.quotes;
      modelUrl.value = this.config.summary.modelConfig.modelUrl;
      inputLength.value = this.config.summary.modelConfig.inputLength.toString();
      outputLength.value = this.config.summary.modelConfig.outputLength.toString();
      threshold.value = this.config.summary.modelConfig.threshold.toString();
    }
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

    // Get summarization settings
    const summaryEnabled = (document.getElementById('summaryEnabled') as HTMLInputElement).checked;
    const autoSummarize = (document.getElementById('autoSummarize') as HTMLInputElement).checked;
    const summaryLength = parseInt((document.getElementById('summaryLength') as HTMLInputElement).value);
    const minSentences = parseInt((document.getElementById('minSentences') as HTMLInputElement).value);
    const maxSentences = parseInt((document.getElementById('maxSentences') as HTMLInputElement).value);
    const priorityHeadlines = (document.getElementById('priorityHeadlines') as HTMLInputElement).checked;
    const priorityLists = (document.getElementById('priorityLists') as HTMLInputElement).checked;
    const priorityQuotes = (document.getElementById('priorityQuotes') as HTMLInputElement).checked;
    const modelUrl = (document.getElementById('modelUrl') as HTMLInputElement).value.trim();
    const inputLength = parseInt((document.getElementById('inputLength') as HTMLInputElement).value);
    const outputLength = parseInt((document.getElementById('outputLength') as HTMLInputElement).value);
    const threshold = parseFloat((document.getElementById('threshold') as HTMLInputElement).value);

    // Validate summarization settings
    if (summaryEnabled) {
      if (isNaN(summaryLength) || summaryLength < 1 || summaryLength > 100) {
        this.showMessage('Summary length must be between 1 and 100', 'error');
        return;
      }
      if (isNaN(minSentences) || minSentences < 1) {
        this.showMessage('Minimum sentences must be at least 1', 'error');
        return;
      }
      if (isNaN(maxSentences) || maxSentences < minSentences) {
        this.showMessage('Maximum sentences must be greater than or equal to minimum sentences', 'error');
        return;
      }
      if (!modelUrl) {
        this.showMessage('Model URL is required when summarization is enabled', 'error');
        return;
      }
      if (isNaN(inputLength) || inputLength < 1) {
        this.showMessage('Input length must be at least 1', 'error');
        return;
      }
      if (isNaN(outputLength) || outputLength < 1) {
        this.showMessage('Output length must be at least 1', 'error');
        return;
      }
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        this.showMessage('Threshold must be between 0 and 1', 'error');
        return;
      }
    }

    const newConfig: SettingsConfig = {
      mnemonic,
      clientId,
      environment: environmentSelect.value as SettingsConfig['environment'],
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null,
      expirationDays,
      summary: {
        enabled: summaryEnabled,
        autoSummarize,
        summaryLength,
        minSentences,
        maxSentences,
        contentPriority: {
          headlines: priorityHeadlines,
          lists: priorityLists,
          quotes: priorityQuotes
        },
        modelConfig: {
          modelUrl,
          inputLength,
          outputLength,
          threshold
        }
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
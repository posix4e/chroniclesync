interface SettingsConfig {
  mnemonic: string;
  clientId: string;
  customApiUrl: string | null;
  environment: 'production' | 'staging' | 'custom';
  openRouterApiKey: string;
  selectedModel: string;
}

type StorageKeys = keyof SettingsConfig;

export class Settings {
  private config: SettingsConfig | null = null;
  private readonly PROD_API_URL = 'https://api.chroniclesync.xyz';
  private readonly STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';
  private bip39WordList: string[] | null = null;

  private readonly DEFAULT_SETTINGS: SettingsConfig = {
    mnemonic: '',
    clientId: '',
    customApiUrl: null,
    environment: 'production',
    openRouterApiKey: '',
    selectedModel: 'anthropic/claude-2'
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
      openRouterApiKey: result.openRouterApiKey || this.DEFAULT_SETTINGS.openRouterApiKey,
      selectedModel: result.selectedModel || this.DEFAULT_SETTINGS.selectedModel
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
      const keys: StorageKeys[] = ['mnemonic', 'clientId', 'customApiUrl', 'environment', 'openRouterApiKey', 'selectedModel'];
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

  private async render(): Promise<void> {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic') as HTMLTextAreaElement;
    const clientIdInput = document.getElementById('clientId') as HTMLInputElement;
    const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
    const customUrlContainer = document.getElementById('customUrlContainer') as HTMLDivElement;
    const customApiUrlInput = document.getElementById('customApiUrl') as HTMLInputElement;
    const openRouterApiKey = document.getElementById('openRouterApiKey') as HTMLInputElement;
    const selectedModel = document.getElementById('selectedModel') as HTMLSelectElement;

    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    openRouterApiKey.value = this.config.openRouterApiKey || '';
    selectedModel.value = this.config.selectedModel || this.DEFAULT_SETTINGS.selectedModel;
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';

    // Load models if API key is available
    if (this.config.openRouterApiKey) {
      await this.updateModelList();
    }

  private setupEventListeners(): void {
    document.getElementById('saveSettings')?.addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
    document.getElementById('generateMnemonic')?.addEventListener('click', () => this.handleGenerateMnemonic());
    document.getElementById('showMnemonic')?.addEventListener('click', () => this.handleShowMnemonic());
    document.getElementById('mnemonic')?.addEventListener('input', () => this.handleMnemonicInput());

    // OpenRouter event listeners
    const openRouterApiKey = document.getElementById('openRouterApiKey');
    const selectedModel = document.getElementById('selectedModel');
    
    if (openRouterApiKey) {
      let debounceTimer: number;
      openRouterApiKey.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => this.updateModelList(), 500);
      });
    }
    
    if (selectedModel) {
      selectedModel.addEventListener('change', () => this.updateModelInfo());
    }
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

    const mnemonic = mnemonicInput.value.trim();
    if (!this.validateMnemonic(mnemonic)) {
      this.showMessage('Please enter a valid 24-word mnemonic phrase', 'error');
      return;
    }

    const clientId = await this.generateClientId(mnemonic);
    clientIdInput.value = clientId;

    const openRouterApiKey = document.getElementById('openRouterApiKey') as HTMLInputElement;
    const selectedModel = document.getElementById('selectedModel') as HTMLSelectElement;

    const newConfig: SettingsConfig = {
      mnemonic,
      clientId,
      environment: environmentSelect.value as SettingsConfig['environment'],
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null,
      openRouterApiKey: openRouterApiKey ? openRouterApiKey.value.trim() : '',
      selectedModel: selectedModel ? selectedModel.value : this.DEFAULT_SETTINGS.selectedModel
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

  async getOpenRouterApiKey(): Promise<string> {
    if (!this.config) throw new Error('Settings not initialized');
    return this.config.openRouterApiKey;
  }

  async getSelectedModel(): Promise<string> {
    if (!this.config) throw new Error('Settings not initialized');
    return this.config.selectedModel;
  }

  async fetchModels(): Promise<any[]> {
    if (!this.config?.openRouterApiKey) return [];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': chrome.runtime.getURL(''),
          'X-Title': 'ChronicleSync'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      this.showMessage('Failed to fetch models: ' + (error instanceof Error ? error.message : String(error)), 'error');
      return [];
    }
  }

  async updateModelList(): Promise<void> {
    const models = await this.fetchModels();
    const modelSelect = document.getElementById('selectedModel') as HTMLSelectElement;
    const modelInfo = document.getElementById('modelInfo') as HTMLDivElement;
    
    if (!modelSelect || !modelInfo) return;

    // Clear existing options
    modelSelect.innerHTML = '';
    
    if (models.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = this.config?.openRouterApiKey ? 'Failed to load models' : 'Enter API key to load models';
      modelSelect.appendChild(option);
      modelInfo.style.display = 'none';
      return;
    }

    // Add options for each model
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      option.dataset.description = model.description;
      option.dataset.contextLength = model.context_length;
      option.dataset.pricing = `${model.pricing.prompt.toFixed(6)}/${model.pricing.completion.toFixed(6)} per token`;
      modelSelect.appendChild(option);
    });

    // Set the previously selected model if it exists
    if (this.config?.selectedModel) {
      modelSelect.value = this.config.selectedModel;
    }

    this.updateModelInfo();
  }

  private updateModelInfo(): void {
    const modelSelect = document.getElementById('selectedModel') as HTMLSelectElement;
    const modelInfo = document.getElementById('modelInfo') as HTMLDivElement;
    const description = modelInfo.querySelector('.model-description') as HTMLParagraphElement;
    const contextLength = modelInfo.querySelector('.context-length') as HTMLSpanElement;
    const pricing = modelInfo.querySelector('.pricing') as HTMLSpanElement;

    if (!modelSelect || !modelInfo || !description || !contextLength || !pricing) return;

    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
      modelInfo.style.display = 'none';
      return;
    }

    description.textContent = selectedOption.dataset.description || '';
    contextLength.textContent = `Context: ${selectedOption.dataset.contextLength || '0'} tokens`;
    pricing.textContent = `Price: ${selectedOption.dataset.pricing || '0/0 per token'}`;
    modelInfo.style.display = 'block';
  }
}
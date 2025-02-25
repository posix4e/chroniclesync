class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      mnemonic: '',
      clientId: '',
      customApiUrl: null,
      environment: 'production',
      openRouterApiKey: '',
      selectedModel: ''
    };
    this.bip39WordList = null;
    this.wordListPromise = this.loadBip39WordList();
  }

  async loadBip39WordList() {
    try {
      const { wordList } = await import('./bip39-wordlist.js');
      this.bip39WordList = wordList;
      return this.bip39WordList;
    } catch (error) {
      console.error('Error loading wordlist:', error);
      return null;
    }
  }

  generateMnemonic() {
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

  validateMnemonic(mnemonic) {
    if (!this.bip39WordList) return false;
    const words = mnemonic.trim().toLowerCase().split(/\s+/);
    if (words.length !== 24) return false;
    return words.every(word => this.bip39WordList.includes(word));
  }

  generateClientId(mnemonic) {
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    return crypto.subtle.digest('SHA-256', data)
      .then(hash => {
        const hashArray = Array.from(new Uint8Array(hash));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
  }

  async fetchOpenRouterModels() {
    const apiKey = document.getElementById('openRouterApiKey')?.value;
    if (!apiKey) return [];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
      this.showMessage('Failed to fetch models: ' + error.message, 'error');
      return [];
    }
  }

  async updateModelList() {
    const models = await this.fetchOpenRouterModels();
    const modelSelect = document.getElementById('selectedModel');
    const modelInfo = document.getElementById('modelInfo');
    
    if (!modelSelect || !modelInfo) return;

    // Clear existing options
    modelSelect.innerHTML = '';
    
    if (models.length === 0) {
      modelSelect.innerHTML = '<option value="">Enter API key to load models</option>';
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
    if (this.config.selectedModel) {
      modelSelect.value = this.config.selectedModel;
    }

    this.updateModelInfo();
  }

  updateModelInfo() {
    const modelSelect = document.getElementById('selectedModel');
    const modelInfo = document.getElementById('modelInfo');
    const description = modelInfo.querySelector('.model-description');
    const contextLength = modelInfo.querySelector('.context-length');
    const pricing = modelInfo.querySelector('.pricing');

    if (!modelSelect || !modelInfo || !description || !contextLength || !pricing) return;

    const selectedOption = modelSelect.options[modelSelect.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
      modelInfo.style.display = 'none';
      return;
    }

    description.textContent = selectedOption.dataset.description;
    contextLength.textContent = `Context: ${selectedOption.dataset.contextLength} tokens`;
    pricing.textContent = `Price: ${selectedOption.dataset.pricing}`;
    modelInfo.style.display = 'block';
  }

  async init() {
    await this.wordListPromise;

    // Clear any existing storage
    await new Promise(resolve => {
      chrome.storage.sync.clear(resolve);
    });

    this.config = { ...this.DEFAULT_SETTINGS };
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    const customApiUrlInput = document.getElementById('customApiUrl');
    const openRouterApiKey = document.getElementById('openRouterApiKey');
    const selectedModel = document.getElementById('selectedModel');

    if (mnemonicInput) {
      mnemonicInput.value = '';
      mnemonicInput.classList.add('hidden');
    }
    if (clientIdInput) clientIdInput.value = '';
    if (environmentSelect) environmentSelect.value = this.DEFAULT_SETTINGS.environment;
    if (customApiUrlInput) customApiUrlInput.value = '';
    if (openRouterApiKey) openRouterApiKey.value = this.config.openRouterApiKey || '';
    if (selectedModel) selectedModel.value = this.config.selectedModel || '';
    
    if (customUrlContainer) {
      customUrlContainer.style.display = 'none';
    }
  }

  setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', e => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
    document.getElementById('generateMnemonic')?.addEventListener('click', () => this.handleGenerateMnemonic());
    document.getElementById('showMnemonic')?.addEventListener('click', () => this.handleShowMnemonic());
    document.getElementById('mnemonic')?.addEventListener('input', () => this.handleMnemonicInput());
    document.getElementById('openRouterApiKey')?.addEventListener('input', () => this.updateModelList());
    document.getElementById('selectedModel')?.addEventListener('change', () => this.updateModelInfo());
  }

  async handleMnemonicInput() {
    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    if (!mnemonicInput || !clientIdInput) return;

    const mnemonic = mnemonicInput.value.trim();
    if (this.validateMnemonic(mnemonic)) {
      const clientId = await this.generateClientId(mnemonic);
      clientIdInput.value = clientId;
      this.config = {
        ...this.config,
        mnemonic,
        clientId
      };
    } else {
      clientIdInput.value = '';
    }
  }

  handleShowMnemonic() {
    const mnemonicInput = document.getElementById('mnemonic');
    if (!mnemonicInput) return;
    mnemonicInput.classList.toggle('hidden');
  }

  async handleGenerateMnemonic() {
    const mnemonicInput = document.getElementById('mnemonic');
    if (!mnemonicInput) return;

    const mnemonic = this.generateMnemonic();
    if (mnemonic) {
      mnemonicInput.value = mnemonic;
      await this.handleMnemonicInput();
      await this.handleSave();
    }
  }

  handleEnvironmentChange() {
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    
    if (environmentSelect && customUrlContainer) {
      customUrlContainer.style.display = environmentSelect.value === 'custom' ? 'block' : 'none';
    }
  }

  async handleSave(event) {
    if (event) {
      event.preventDefault();
    }

    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customApiUrlInput = document.getElementById('customApiUrl');

    if (!mnemonicInput || !clientIdInput || !environmentSelect) return;

    // Remove any existing messages first
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());

    // First check if custom environment has URL
    if (environmentSelect.value === 'custom' && (!customApiUrlInput || !customApiUrlInput.value.trim())) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

    const mnemonic = mnemonicInput.value.trim();
    if (!this.validateMnemonic(mnemonic)) {
      this.showMessage('Please enter a valid 24-word mnemonic phrase', 'error');
      return;
    }

    const clientId = await this.generateClientId(mnemonic);
    clientIdInput.value = clientId;

    const openRouterApiKey = document.getElementById('openRouterApiKey');
    const selectedModel = document.getElementById('selectedModel');

    const newConfig = {
      mnemonic: mnemonic,
      clientId: clientId,
      environment: environmentSelect.value,
      customApiUrl: environmentSelect.value === 'custom' && customApiUrlInput ? customApiUrlInput.value.trim() : null,
      openRouterApiKey: openRouterApiKey ? openRouterApiKey.value.trim() : '',
      selectedModel: selectedModel ? selectedModel.value : ''
    };

    await new Promise(resolve => {
      chrome.storage.sync.set(newConfig, resolve);
    });

    this.config = newConfig;
    this.showMessage('Settings saved successfully!', 'success');
  }

  async handleReset() {
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
        this.handleSave();
      }
    }
  }

  showMessage(text, type = 'success') {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());

    const status = document.createElement('div');
    status.className = `status-message ${type}`;
    status.textContent = text;
    document.querySelector('.settings-actions')?.appendChild(status);

    setTimeout(() => {
      status.remove();
    }, 3000);
  }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const settings = new Settings();
  settings.init();
});

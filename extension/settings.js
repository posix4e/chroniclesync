class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      mnemonic: '',
      clientId: '',
      customApiUrl: null,
      environment: 'production',
      summarizationModel: 'Xenova/distilbart-cnn-6-6'
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
    const summarizationModelSelect = document.getElementById('summarizationModel');

    if (mnemonicInput) {
      mnemonicInput.value = '';
      mnemonicInput.classList.add('hidden');
    }
    if (clientIdInput) clientIdInput.value = '';
    if (environmentSelect) environmentSelect.value = this.DEFAULT_SETTINGS.environment;
    if (customApiUrlInput) customApiUrlInput.value = '';
    if (summarizationModelSelect) summarizationModelSelect.value = this.DEFAULT_SETTINGS.summarizationModel;
    
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
    const enableSummarizationCheckbox = document.getElementById('enableSummarization');
    const summarizationModelSelect = document.getElementById('summarizationModel');

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

    const newConfig = {
      mnemonic: mnemonic,
      clientId: clientId,
      environment: environmentSelect.value,
      customApiUrl: environmentSelect.value === 'custom' && customApiUrlInput ? customApiUrlInput.value.trim() : null,
      summarizationModel: summarizationModelSelect ? summarizationModelSelect.value : this.DEFAULT_SETTINGS.summarizationModel
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

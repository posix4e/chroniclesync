class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      mnemonic: '',
      clientId: '',
      customApiUrl: null,
      environment: 'production'
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

    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['mnemonic', 'clientId', 'customApiUrl', 'environment'], resolve);
    });

    if (result.mnemonic && result.clientId) {
      this.config = {
        mnemonic: result.mnemonic,
        clientId: result.clientId,
        customApiUrl: result.customApiUrl || this.DEFAULT_SETTINGS.customApiUrl,
        environment: result.environment || this.DEFAULT_SETTINGS.environment
      };
    } else {
      // Generate initial mnemonic
      this.config = { ...this.DEFAULT_SETTINGS };
    }

    this.render();
    this.setupEventListeners();

    // Wait for the page to load
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

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
        const mnemonicInput = document.getElementById('mnemonic');
        const clientIdInput = document.getElementById('clientId');
        if (mnemonicInput && clientIdInput) {
          mnemonicInput.value = mnemonic;
          clientIdInput.value = clientId;
        }
        await this.handleSave();
      }
    }

    // Ensure we have a valid mnemonic and client ID
    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    if (mnemonicInput && clientIdInput) {
      const mnemonic = mnemonicInput.value.trim();
      const clientId = clientIdInput.value.trim();
      if (!mnemonic || !clientId) {
        const mnemonic = this.generateMnemonic();
        if (mnemonic) {
          const clientId = await this.generateClientId(mnemonic);
          this.config = {
            ...this.config,
            mnemonic,
            clientId
          };
          mnemonicInput.value = mnemonic;
          clientIdInput.value = clientId;
          await this.handleSave();
        }
      }
    }

    // Wait for the mnemonic and client ID to be saved
    await new Promise(resolve => setTimeout(resolve, 100));
    const finalMnemonic = document.getElementById('mnemonic')?.value.trim();
    const finalClientId = document.getElementById('clientId')?.value.trim();
    if (!finalMnemonic || !finalClientId) {
      await this.handleGenerateMnemonic();
      await this.handleSave();
    }
  }

  render() {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    const customApiUrlInput = document.getElementById('customApiUrl');

    if (mnemonicInput) {
      mnemonicInput.value = this.config.mnemonic;
      mnemonicInput.classList.add('hidden');
    }
    if (clientIdInput) clientIdInput.value = this.config.clientId;
    if (environmentSelect) environmentSelect.value = this.config.environment;
    if (customApiUrlInput) customApiUrlInput.value = this.config.customApiUrl || '';
    
    if (customUrlContainer) {
      customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';
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

    if (!mnemonicInput || !clientIdInput || !environmentSelect) return;

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
      customApiUrl: environmentSelect.value === 'custom' && customApiUrlInput ? customApiUrlInput.value.trim() : null
    };

    if (newConfig.environment === 'custom' && !newConfig.customApiUrl) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

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

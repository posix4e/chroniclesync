class Settings {
  constructor() {
    this.config = null;
    this.PROD_API_URL = 'https://api.chroniclesync.xyz';
    this.STAGING_API_URL = 'https://api-staging.chroniclesync.xyz';

    this.DEFAULT_SETTINGS = {
      clientId: '',
      mnemonic: '',
      customApiUrl: null,
      environment: 'production'
    };
  }

  async init() {
    console.log('Initializing settings...');
    const result = await this.getStorageData();
    this.config = {
      clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
      mnemonic: result.mnemonic || this.DEFAULT_SETTINGS.mnemonic,
      customApiUrl: result.customApiUrl || this.DEFAULT_SETTINGS.customApiUrl,
      environment: result.environment || this.DEFAULT_SETTINGS.environment
    };
    console.log('Config loaded:', this.config);
    this.render();
    this.setupEventListeners();
    console.log('Settings initialized');
  }

  async getStorageData() {
    return new Promise((resolve) => {
      const keys = ['clientId', 'mnemonic', 'customApiUrl', 'environment'];
      chrome.storage.sync.get(keys, (result) => resolve(result));
    });
  }

  getApiUrl() {
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

  render() {
    if (!this.config) return;

    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    const customApiUrlInput = document.getElementById('customApiUrl');

    mnemonicInput.value = this.config.mnemonic;
    clientIdInput.value = this.config.clientId;
    clientIdInput.readOnly = true;
    environmentSelect.value = this.config.environment;
    customApiUrlInput.value = this.config.customApiUrl || '';
    
    customUrlContainer.style.display = this.config.environment === 'custom' ? 'block' : 'none';
  }

  setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', (e) => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
    document.getElementById('generateKeys')?.addEventListener('click', () => this.handleGenerateKeys());
    document.getElementById('generateMnemonic')?.addEventListener('click', () => this.handleGenerateMnemonic());
  }

  handleEnvironmentChange() {
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    customUrlContainer.style.display = environmentSelect.value === 'custom' ? 'block' : 'none';
  }

  handleGenerateMnemonic() {
    const mnemonicInput = document.getElementById('mnemonic');
    mnemonicInput.value = EncryptionService.generateMnemonic();
  }

  async handleGenerateKeys() {
    console.log('Generating keys...');
    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const keyStatus = document.querySelector('.key-status');
    const mnemonic = mnemonicInput.value.trim();
    console.log('Mnemonic:', mnemonic);

    try {
      if (!EncryptionService.validateMnemonic(mnemonic)) {
        console.log('Invalid mnemonic');
        keyStatus.textContent = 'Invalid mnemonic phrase';
        keyStatus.className = 'key-status error';
        return;
      }

      console.log('Generating client ID...');
      const clientId = await EncryptionService.generateClientId(mnemonic);
      console.log('Client ID:', clientId);
      clientIdInput.value = clientId;

      // Also derive the encryption key and store it securely
      console.log('Deriving encryption key...');
      const encryptionKey = await EncryptionService.deriveEncryptionKey(mnemonic);
      console.log('Encryption key derived');
      // The encryption key will be used for encrypting/decrypting data

      keyStatus.textContent = 'Keys generated successfully!';
      keyStatus.className = 'key-status success';
      this.showMessage('Keys generated successfully!', 'success');
      console.log('Keys generated successfully');
    } catch (error) {
      console.error('Error generating keys:', error);
      keyStatus.textContent = 'Error generating keys: ' + error.message;
      keyStatus.className = 'key-status error';
      this.showMessage('Error generating keys: ' + error.message, 'error');
    }
  }

  async handleSave(event) {
    event?.preventDefault();

    const mnemonicInput = document.getElementById('mnemonic');
    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customApiUrlInput = document.getElementById('customApiUrl');

    const mnemonic = mnemonicInput.value.trim();
    if (!EncryptionService.validateMnemonic(mnemonic)) {
      this.showMessage('Invalid mnemonic phrase', 'error');
      return;
    }

    const newConfig = {
      mnemonic,
      clientId: clientIdInput.value.trim(),
      environment: environmentSelect.value,
      customApiUrl: environmentSelect.value === 'custom' ? customApiUrlInput.value.trim() : null
    };

    if (newConfig.environment === 'custom' && !newConfig.customApiUrl) {
      this.showMessage('Custom API URL is required when using custom environment', 'error');
      return;
    }

    await new Promise((resolve) => {
      chrome.storage.sync.set(newConfig, () => resolve());
    });

    this.config = newConfig;
    this.showMessage('Settings saved successfully!', 'success');
  }

  handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      this.handleSave();
    }
  }

  showMessage(text, type) {
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
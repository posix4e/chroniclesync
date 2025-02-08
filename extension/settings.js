class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      clientId: '',
      customApiUrl: null,
      environment: 'production'
    };
  }

  async init() {
    console.log('Initializing settings...');
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['clientId', 'customApiUrl', 'environment'], resolve);
    });

    console.log('Loaded settings:', result);

    this.config = {
      clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
      customApiUrl: result.customApiUrl || this.DEFAULT_SETTINGS.customApiUrl,
      environment: result.environment || this.DEFAULT_SETTINGS.environment
    };

    console.log('Config:', this.config);

    this.render();
    this.setupEventListeners();
    console.log('Settings initialized');
  }

  render() {
    console.log('Rendering settings...');
    if (!this.config) {
      console.log('No config available');
      return;
    }

    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    const customApiUrlInput = document.getElementById('customApiUrl');

    console.log('Elements found:', {
      clientIdInput: !!clientIdInput,
      environmentSelect: !!environmentSelect,
      customUrlContainer: !!customUrlContainer,
      customApiUrlInput: !!customApiUrlInput
    });

    if (clientIdInput) clientIdInput.value = this.config.clientId;
    if (environmentSelect) environmentSelect.value = this.config.environment;
    if (customApiUrlInput) customApiUrlInput.value = this.config.customApiUrl || '';
    
    if (customUrlContainer) {
      const display = this.config.environment === 'custom' ? 'block' : 'none';
      console.log('Setting custom URL container display to:', display);
      customUrlContainer.style.display = display;
    }

    console.log('Render complete');
  }

  setupEventListeners() {
    document.getElementById('saveSettings')?.addEventListener('click', e => this.handleSave(e));
    document.getElementById('resetSettings')?.addEventListener('click', () => this.handleReset());
    document.getElementById('environment')?.addEventListener('change', () => this.handleEnvironmentChange());
  }

  handleEnvironmentChange() {
    console.log('Environment change event triggered');
    const environmentSelect = document.getElementById('environment');
    const customUrlContainer = document.getElementById('customUrlContainer');
    
    console.log('Environment:', environmentSelect?.value);
    console.log('Container found:', !!customUrlContainer);
    
    if (environmentSelect && customUrlContainer) {
      const display = environmentSelect.value === 'custom' ? 'block' : 'none';
      console.log('Setting display to:', display);
      customUrlContainer.style.display = display;
    }
  }

  async handleSave(event) {
    if (event) {
      event.preventDefault();
    }

    const clientIdInput = document.getElementById('clientId');
    const environmentSelect = document.getElementById('environment');
    const customApiUrlInput = document.getElementById('customApiUrl');

    if (!clientIdInput || !environmentSelect) return;

    const newConfig = {
      clientId: clientIdInput.value.trim(),
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

  handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      this.handleSave();
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
  settings.init().catch(console.error);
});

export default Settings;

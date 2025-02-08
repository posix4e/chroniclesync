class Settings {
  constructor() {
    this.config = null;
    this.API_ENVIRONMENTS = {
      production: 'https://api.chroniclesync.xyz',
      staging: 'https://staging-api.chroniclesync.xyz'
    };
    this.PAGES_ENVIRONMENTS = {
      production: 'https://chroniclesync.pages.dev'
    };
    this.DEFAULT_SETTINGS = {
      clientId: '',
      apiUrl: this.API_ENVIRONMENTS.production,
      apiEnvironment: 'production',
      pagesUrl: this.PAGES_ENVIRONMENTS.production,
      pagesEnvironment: 'production'
    };
    this.messageTimeout = null;
  }

  async init() {
    try {
      // Load settings from storage
      const result = await new Promise(resolve => {
        chrome.storage.sync.get(['clientId', 'apiUrl', 'apiEnvironment', 'pagesUrl', 'pagesEnvironment'], resolve);
      });

      this.config = {
        clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
        apiUrl: result.apiUrl || this.DEFAULT_SETTINGS.apiUrl,
        apiEnvironment: result.apiEnvironment || this.DEFAULT_SETTINGS.apiEnvironment,
        pagesUrl: result.pagesUrl || this.DEFAULT_SETTINGS.pagesUrl,
        pagesEnvironment: result.pagesEnvironment || this.DEFAULT_SETTINGS.pagesEnvironment
      };

      this.render();
      this.setupEventListeners();
      this.updateEnvironmentUI();
      
      // Show warning if client ID is not set
      if (!this.config.clientId) {
        this.showMessage('Please configure your Client ID to start syncing', 'warning');
      }
    } catch (error) {
      this.showMessage('Error loading settings: ' + error.message, 'error');
    }
  }

  render() {
    document.getElementById('clientId').value = this.config.clientId;
    document.getElementById('apiUrl').value = this.config.apiUrl;
    document.getElementById('pagesUrl').value = this.config.pagesUrl;
    document.getElementById('apiEnvironment').value = this.config.apiEnvironment;
    document.getElementById('pagesEnvironment').value = this.config.pagesEnvironment;
  }

  setupEventListeners() {
    document.getElementById('saveSettings').addEventListener('click', e => this.handleSave(e));
    document.getElementById('resetSettings').addEventListener('click', () => this.handleReset());
    document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
    document.getElementById('apiEnvironment').addEventListener('change', () => this.handleApiEnvironmentChange());
    document.getElementById('pagesEnvironment').addEventListener('change', () => this.handlePagesEnvironmentChange());
  }

  updateEnvironmentUI() {
    const apiEnvironment = document.getElementById('apiEnvironment').value;
    const pagesEnvironment = document.getElementById('pagesEnvironment').value;
    const apiUrlInput = document.getElementById('apiUrl');
    const pagesUrlInput = document.getElementById('pagesUrl');

    // Handle API URL input
    if (apiEnvironment === 'custom') {
      apiUrlInput.removeAttribute('readonly');
    } else {
      apiUrlInput.setAttribute('readonly', 'true');
      if (this.API_ENVIRONMENTS[apiEnvironment]) {
        apiUrlInput.value = this.API_ENVIRONMENTS[apiEnvironment];
      }
    }

    // Handle Pages URL input
    if (pagesEnvironment === 'custom') {
      pagesUrlInput.removeAttribute('readonly');
    } else {
      pagesUrlInput.setAttribute('readonly', 'true');
      if (this.PAGES_ENVIRONMENTS[pagesEnvironment]) {
        pagesUrlInput.value = this.PAGES_ENVIRONMENTS[pagesEnvironment];
      }
    }
  }

  handleApiEnvironmentChange() {
    const apiEnvironment = document.getElementById('apiEnvironment').value;
    this.config.apiEnvironment = apiEnvironment;

    if (apiEnvironment !== 'custom' && this.API_ENVIRONMENTS[apiEnvironment]) {
      this.config.apiUrl = this.API_ENVIRONMENTS[apiEnvironment];
    }

    this.updateEnvironmentUI();
  }

  handlePagesEnvironmentChange() {
    const pagesEnvironment = document.getElementById('pagesEnvironment').value;
    this.config.pagesEnvironment = pagesEnvironment;

    if (pagesEnvironment !== 'custom' && this.PAGES_ENVIRONMENTS[pagesEnvironment]) {
      this.config.pagesUrl = this.PAGES_ENVIRONMENTS[pagesEnvironment];
    }

    this.updateEnvironmentUI();
  }

  async handleSave(event) {
    if (event) {
      event.preventDefault();
    }

    try {
      const newConfig = {
        clientId: document.getElementById('clientId').value.trim(),
        apiUrl: document.getElementById('apiUrl').value.trim(),
        pagesUrl: document.getElementById('pagesUrl').value.trim(),
        apiEnvironment: document.getElementById('apiEnvironment').value,
        pagesEnvironment: document.getElementById('pagesEnvironment').value
      };

      // Validate required fields
      if (!newConfig.clientId) {
        throw new Error('Client ID is required');
      }

      if (!this.isValidUrl(newConfig.apiUrl)) {
        throw new Error('Invalid API URL');
      }

      if (!this.isValidUrl(newConfig.pagesUrl)) {
        throw new Error('Invalid Pages URL');
      }

      await new Promise(resolve => {
        chrome.storage.sync.set(newConfig, resolve);
      });

      this.config = newConfig;
      this.showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      this.showMessage('Error saving settings: ' + error.message, 'error');
    }
  }

  async handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      await new Promise(resolve => {
        chrome.storage.sync.set(this.DEFAULT_SETTINGS, resolve);
      });
    }
  }

  async testConnection() {
    try {
      const response = await fetch(this.config.apiUrl + '/health');
      if (!response.ok) {
        throw new Error('API returned status ' + response.status);
      }
      this.showMessage('Connection successful!', 'success');
    } catch (error) {
      this.showMessage('Connection failed: ' + error.message, 'error');
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  showMessage(text, type = 'info') {
    // Clear any existing message
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      const oldStatus = document.querySelector('.status-message');
      if (oldStatus) {
        oldStatus.remove();
      }
    }

    const status = document.createElement('div');
    status.className = `status-message ${type}`;
    status.textContent = text;
    document.querySelector('.settings-actions').appendChild(status);

    // Don't auto-hide error messages
    if (type !== 'error') {
      this.messageTimeout = setTimeout(() => {
        status.remove();
        this.messageTimeout = null;
      }, 3000);
    }
  }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const settings = new Settings();
  settings.init();
});

export default Settings;

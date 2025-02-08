class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      clientId: '',
      apiUrl: 'https://api.chroniclesync.xyz',
      pagesUrl: 'https://pages.chroniclesync.xyz'
    };
    this.messageTimeout = null;
  }

  async init() {
    try {
      // Load settings from storage
      const result = await new Promise(resolve => {
        chrome.storage.sync.get(['clientId', 'apiUrl', 'pagesUrl'], resolve);
      });

      this.config = {
        clientId: result.clientId || this.DEFAULT_SETTINGS.clientId,
        apiUrl: result.apiUrl || this.DEFAULT_SETTINGS.apiUrl,
        pagesUrl: result.pagesUrl || this.DEFAULT_SETTINGS.pagesUrl
      };

      this.render();
      this.setupEventListeners();
      
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
  }

  setupEventListeners() {
    document.getElementById('saveSettings').addEventListener('click', e => this.handleSave(e));
    document.getElementById('resetSettings').addEventListener('click', () => this.handleReset());
    document.getElementById('testConnection').addEventListener('click', () => this.testConnection());
  }

  async handleSave(event) {
    if (event) {
      event.preventDefault();
    }

    try {
      const newConfig = {
        clientId: document.getElementById('clientId').value.trim(),
        apiUrl: document.getElementById('apiUrl').value.trim(),
        pagesUrl: document.getElementById('pagesUrl').value.trim()
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

  handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      this.handleSave();
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
    } catch (_) {
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

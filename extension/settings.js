class Settings {
  constructor() {
    this.config = null;
    this.DEFAULT_SETTINGS = {
      clientId: '',
      apiUrl: 'https://api.chroniclesync.xyz',
      pagesUrl: 'https://pages.chroniclesync.xyz'
    };
  }

  async init() {
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
  }

  render() {
    document.getElementById('clientId').value = this.config.clientId;
    document.getElementById('apiUrl').value = this.config.apiUrl;
    document.getElementById('pagesUrl').value = this.config.pagesUrl;
  }

  setupEventListeners() {
    document.getElementById('saveSettings').addEventListener('click', e => this.handleSave(e));
    document.getElementById('resetSettings').addEventListener('click', () => this.handleReset());
  }

  async handleSave(event) {
    if (event) {
      event.preventDefault();
    }

    const newConfig = {
      clientId: document.getElementById('clientId').value,
      apiUrl: document.getElementById('apiUrl').value,
      pagesUrl: document.getElementById('pagesUrl').value
    };

    await new Promise(resolve => {
      chrome.storage.sync.set(newConfig, resolve);
    });

    this.config = newConfig;
    this.showMessage('Settings saved successfully!');
  }

  handleReset() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.config = { ...this.DEFAULT_SETTINGS };
      this.render();
      this.handleSave();
    }
  }

  showMessage(text) {
    const status = document.createElement('div');
    status.className = 'status-message';
    status.textContent = text;
    document.querySelector('.settings-actions').appendChild(status);

    setTimeout(() => {
      status.remove();
    }, 2000);
  }
}

// Initialize settings when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const settings = new Settings();
  settings.init();
});

export default Settings;

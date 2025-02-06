import { getConfig, saveConfig, defaultConfig } from './config.js';

class Settings {
  constructor() {
    this.config = null;
  }

  async init() {
    this.config = await getConfig();
    this.render();
  }

  async handleSave(event) {
    event.preventDefault();
    const form = event.target;
    const newConfig = {
      apiEndpoint: form.elements.apiEndpoint.value.trim(),
      pagesUrl: form.elements.pagesUrl.value.trim(),
      clientId: form.elements.clientId.value.trim()
    };
    
    if (await saveConfig(newConfig)) {
      this.config = newConfig;
      this.showMessage('Settings saved successfully!', 'success');
    } else {
      this.showMessage('Failed to save settings.', 'error');
    }
  }

  handleReset() {
    if (confirm('Reset to default settings?')) {
      saveConfig(defaultConfig).then(() => {
        this.config = defaultConfig;
        this.render();
        this.showMessage('Settings reset to defaults.', 'success');
      });
    }
  }

  showMessage(message, type) {
    const messageEl = document.getElementById('settings-message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3000);
  }

  render() {
    const container = document.getElementById('settings-container');
    if (!container) return;

    container.innerHTML = `
      <form id="settings-form">
        <div class="form-group">
          <label for="apiEndpoint">Worker API Endpoint:</label>
          <select id="apiEndpointSelect">
            <option value="https://api.chroniclesync.xyz">Production (https://api.chroniclesync.xyz)</option>
            <option value="https://api-staging.chroniclesync.xyz">Staging (https://api-staging.chroniclesync.xyz)</option>
            <option value="custom">Custom</option>
          </select>
          <input type="url" id="apiEndpoint" name="apiEndpoint" value="${this.config.apiEndpoint}" required placeholder="https://api.chroniclesync.xyz">
        </div>
        <div class="form-group">
          <label for="pagesUrl">Pages UI URL:</label>
          <select id="pagesUrlSelect">
            <option value="https://chroniclesync.pages.dev">Default (https://chroniclesync.pages.dev)</option>
            <option value="custom">Custom</option>
          </select>
          <input type="url" id="pagesUrl" name="pagesUrl" value="${this.config.pagesUrl}" required placeholder="https://chroniclesync.pages.dev">
        </div>
        <div class="form-group">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" name="clientId" value="${this.config.clientId}" required placeholder="extension-default">
        </div>
        <div class="button-group">
          <button type="submit">Save Settings</button>
          <button type="button" id="reset-settings">Reset to Defaults</button>
        </div>
        <div id="settings-message" class="message"></div>
      </form>
    `;

    const apiEndpointSelect = document.getElementById('apiEndpointSelect');
    const apiEndpointInput = document.getElementById('apiEndpoint');
    if (this.config.apiEndpoint === 'https://api.chroniclesync.xyz' || this.config.apiEndpoint === 'https://api-staging.chroniclesync.xyz') {
      apiEndpointSelect.value = this.config.apiEndpoint;
      apiEndpointInput.disabled = true;
    } else {
      apiEndpointSelect.value = 'custom';
      apiEndpointInput.disabled = false;
    }
    apiEndpointSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        apiEndpointInput.disabled = false;
      } else {
        apiEndpointInput.value = e.target.value;
        apiEndpointInput.disabled = true;
      }
    });

    const pagesUrlSelect = document.getElementById('pagesUrlSelect');
    const pagesUrlInput = document.getElementById('pagesUrl');
    if (this.config.pagesUrl === 'https://chroniclesync.pages.dev') {
      pagesUrlSelect.value = this.config.pagesUrl;
      pagesUrlInput.disabled = true;
    } else {
      pagesUrlSelect.value = 'custom';
      pagesUrlInput.disabled = false;
    }
    pagesUrlSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        pagesUrlInput.disabled = false;
      } else {
        pagesUrlInput.value = e.target.value;
        pagesUrlInput.disabled = true;
      }
    });

    const form = document.getElementById('settings-form');
    const resetButton = document.getElementById('reset-settings');

    form.addEventListener('submit', (e) => this.handleSave(e));
    resetButton.addEventListener('click', () => this.handleReset());
  }
}

export default Settings;
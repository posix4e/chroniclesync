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
      await chrome.storage.local.set({ 
        clientId: newConfig.clientId,
        firstTimeSetupComplete: true 
      });
      this.showMessage('Settings saved successfully!', 'success');
      
      // Open the pages URL in a new tab
      const pagesUrl = new URL(newConfig.pagesUrl);
      pagesUrl.searchParams.set('clientId', newConfig.clientId);
      chrome.tabs.create({ url: pagesUrl.toString() });

      // Close the settings window after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      this.showMessage('Failed to save settings.', 'error');
    }
  }

  handleReset() {
    if (confirm('Reset to default settings?')) {
      saveConfig(defaultConfig).then(async () => {
        this.config = defaultConfig;
        await chrome.storage.local.set({ 
          clientId: defaultConfig.clientId,
          firstTimeSetupComplete: false 
        });
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
      <h2>ChronicleSync Settings</h2>
      <form id="settings-form">
        <div class="form-group">
          <label for="apiEndpoint">Worker API Endpoint:</label>
          <input type="url" id="apiEndpoint" name="apiEndpoint" 
                 value="${this.config.apiEndpoint}" required
                 placeholder="https://api.chroniclesync.xyz">
        </div>
        <div class="form-group">
          <label for="pagesUrl">Pages UI URL:</label>
          <input type="url" id="pagesUrl" name="pagesUrl" 
                 value="${this.config.pagesUrl}" required
                 placeholder="https://chroniclesync.pages.dev">
        </div>
        <div class="form-group">
          <label for="clientId">Client ID:</label>
          <input type="text" id="clientId" name="clientId" 
                 value="${this.config.clientId}" required
                 placeholder="extension-default">
        </div>
        <div class="button-group">
          <button type="submit">Save Settings</button>
          <button type="button" id="reset-settings">Reset to Defaults</button>
        </div>
        <div id="settings-message" class="message"></div>
      </form>
    `;

    // Add event listeners
    const form = document.getElementById('settings-form');
    const resetButton = document.getElementById('reset-settings');
    
    form.addEventListener('submit', (e) => this.handleSave(e));
    resetButton.addEventListener('click', () => this.handleReset());
  }
}

export default Settings;
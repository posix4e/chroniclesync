// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  const config = await chrome.storage.sync.get(['config']);
  const currentConfig = config.config || {
    retentionDays: 30,
    apiEndpoint: 'https://api.chroniclesync.xyz',
    syncIntervalMinutes: 30
  };

  // Create header
  const header = document.createElement('h1');
  header.textContent = 'ChronicleSync';
  document.getElementById('root').appendChild(header);

  // Create admin login section
  const adminLogin = document.createElement('div');
  adminLogin.id = 'adminLogin';
  adminLogin.innerHTML = `
    <h2>Admin Login</h2>
    <div>
      <label for="clientId">Client ID:</label>
      <input type="text" id="clientId" placeholder="Enter client ID">
    </div>
    <button type="button" onclick="initializeClient()">Initialize</button>
  `;
  document.getElementById('root').appendChild(adminLogin);

  // Set up configuration form
  const configForm = document.createElement('form');
  configForm.innerHTML = `
    <h2>Settings</h2>
    <div>
      <label for="retentionDays">Retention Period (days):</label>
      <input type="number" id="retentionDays" value="${currentConfig.retentionDays}" min="1" max="365">
    </div>
    <div>
      <label for="apiEndpoint">API Endpoint:</label>
      <input type="url" id="apiEndpoint" value="${currentConfig.apiEndpoint}">
    </div>
    <div>
      <label for="syncInterval">Sync Interval (minutes):</label>
      <input type="number" id="syncInterval" value="${currentConfig.syncIntervalMinutes}" min="5" max="1440">
    </div>
    <button type="submit">Save Settings</button>
    <button type="button" onclick="syncWithServer()">Sync with Server</button>
  `;

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newConfig = {
      retentionDays: parseInt(document.getElementById('retentionDays').value, 10),
      apiEndpoint: document.getElementById('apiEndpoint').value,
      syncIntervalMinutes: parseInt(document.getElementById('syncInterval').value, 10)
    };
    await chrome.storage.sync.set({ config: newConfig });
    // Recreate alarm with new interval
    await chrome.alarms.clear('syncHistory');
    chrome.alarms.create('syncHistory', {
      periodInMinutes: newConfig.syncIntervalMinutes
    });
  });

  // Create history view
  const historyView = document.createElement('div');
  historyView.innerHTML = '<h2>Recent History</h2><div id="historyEntries"></div>';

  // Add elements to page
  document.getElementById('root').appendChild(configForm);
  document.getElementById('root').appendChild(historyView);

  // Load and display history
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('chronicleSync', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  const transaction = db.transaction(['history'], 'readonly');
  const store = transaction.objectStore('history');
  const index = store.index('timestamp');
  const entries = await new Promise((resolve, reject) => {
    const request = index.getAll(null, 50); // Get last 50 entries
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const historyEntries = document.getElementById('historyEntries');
  entries.reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'history-entry';
    div.innerHTML = `
      <a href="${entry.url}" target="_blank">${entry.title || entry.url}</a>
      <span class="timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
    `;
    historyEntries.appendChild(div);
  });
});

// Initialize client with provided ID
async function initializeClient() {
  const clientId = document.getElementById('clientId').value;
  if (!clientId) {
    window.confirm('Please enter a client ID');
    return;
  }

  try {
    await chrome.storage.sync.set({ clientId });
    document.getElementById('adminLogin').style.display = 'none';
    window.confirm('Client initialized successfully');
  } catch (error) {
    console.error('Error initializing client:', error);
    window.confirm('Failed to initialize client');
  }
}

// Sync history with server
async function syncWithServer() {
  const config = await chrome.storage.sync.get(['config', 'clientId']);
  if (!config.clientId) {
    window.confirm('Please initialize client first');
    return;
  }

  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('chronicleSync', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const transaction = db.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const index = store.index('timestamp');
    const cutoffTime = Date.now() - (config.config.retentionDays * 24 * 60 * 60 * 1000);
    
    const entries = await new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.lowerBound(cutoffTime));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const response = await fetch(`${config.config.apiEndpoint}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': config.clientId
      },
      body: JSON.stringify({ entries })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    window.confirm('Sync completed successfully');
  } catch (error) {
    console.error('Error syncing with server:', error);
    window.confirm('Failed to sync with server');
  }
}
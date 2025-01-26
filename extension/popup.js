// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  const config = await chrome.storage.sync.get(['config']);
  const currentConfig = config.config || {
    retentionDays: 30,
    apiEndpoint: 'https://api.chroniclesync.xyz',
    syncIntervalMinutes: 30
  };

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
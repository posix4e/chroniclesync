import { DB } from './db';

// Determine API URL based on the current hostname
const API_URL = (() => {
  const hostname = window.location.hostname;
  
  // Production domain
  if (hostname === 'chroniclesync.xyz') {
    return 'https://api.chroniclesync.xyz';
  }
  
  // Preview deployment (staging) in Cloudflare Pages
  if (hostname.endsWith('chroniclesync.pages.dev')) {
    return 'https://api-staging.chroniclesync.xyz';
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  
  // Default to production API
  return 'https://api.chroniclesync.xyz';
})();
const db = new DB();

async function initializeClient() {
  const clientId = document.getElementById('clientId').value;
  if (!clientId) {
    alert('Please enter a client ID');
    return;
  }

  try {
    await db.init(clientId);
  } catch (error) {
    alert(`Error initializing client: ${error.message}`);
    return;
  }

  try {
    const data = await db.getData();
    document.getElementById('dataInput').value = JSON.stringify(data, null, 2);
    document.getElementById('dataSection').classList.remove('hidden');

    // Try to sync with server
    await syncData();
  } catch (error) {
    alert(`Error loading data: ${error.message}`);
  }
}

async function saveData() {
  let data;
  try {
    data = JSON.parse(document.getElementById('dataInput').value);
  } catch (error) {
    alert('Invalid JSON data');
    return;
  }

  try {
    await db.setData(data);
    alert('Data saved locally');
  } catch (error) {
    alert(`Error saving data: ${error.message}`);
  }
}

async function syncData() {
  try {
    const data = await db.getData();
    const response = await fetch(`${API_URL}?clientId=${db.clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Sync failed');
    }

    alert('Sync successful');
  } catch (error) {
    alert(`Sync error: ${error.message}`);
  }
}

async function loginAdmin() {
  const password = document.getElementById('adminPassword').value;
  if (password === 'francesisthebest') {
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('adminLogin').classList.add('hidden');
    await refreshStats();
  } else {
    alert('Invalid password');
  }
}

async function refreshStats() {
  try {
    const response = await fetch(`${API_URL}/admin/clients`, {
      headers: {
        'Authorization': 'Bearer francesisthebest'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const stats = await response.json();
    const tbody = document.querySelector('#statsTable tbody');
    tbody.innerHTML = '';

    stats.forEach(client => {
      const row = document.createElement('tr');
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteClient(client.clientId));

      const viewBtn = document.createElement('button');
      viewBtn.textContent = 'View Data';
      viewBtn.addEventListener('click', () => viewClientData(client.clientId));

      const actionsCell = document.createElement('td');
      actionsCell.appendChild(deleteBtn);
      actionsCell.appendChild(viewBtn);

      row.innerHTML = `
                <td>${client.clientId}</td>
                <td>${new Date(client.lastSync).toLocaleString()}</td>
                <td>${formatBytes(client.dataSize)}</td>
            `;
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });
  } catch (error) {
    alert(`Error fetching stats: ${error.message}`);
  }
}

async function deleteClient(clientId) {
  if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/client?clientId=${clientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer francesisthebest'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete client');
    }

    await response.json(); // Ensure response is valid JSON
    alert('Client deleted successfully');
    refreshStats();
  } catch (error) {
    alert(`Error deleting client: ${error.message}`);
  }
}

async function viewClientData(clientId) {
  try {
    const response = await fetch(`${API_URL}?clientId=${clientId}`, {
      headers: {
        'Authorization': 'Bearer francesisthebest'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch client data');
    }

    const data = await response.json();
    alert(JSON.stringify(data, null, 2));
  } catch (error) {
    alert(`Error fetching client data: ${error.message}`);
  }
}



async function checkHealth() {
  const healthStatus = document.getElementById('healthStatus');
  const lastCheck = document.getElementById('lastCheck');
  
  try {
    const response = await fetch(`${API_URL}/health?clientId=${db.clientId || 'system'}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    
    healthStatus.textContent = data.healthy ? '✅ Healthy' : '❌ Unhealthy';
    healthStatus.className = data.healthy ? 'health-ok' : 'health-error';
    lastCheck.textContent = new Date().toLocaleString();
    
    if (!data.healthy && data.error) {
      alert(`Health check failed: ${data.error}`);
    }
  } catch (error) {
    healthStatus.textContent = '❌ Error';
    healthStatus.className = 'health-error';
    lastCheck.textContent = new Date().toLocaleString();
    alert(`Health check error: ${error.message}`);
  }
}

// Make functions available globally for onclick handlers
window.checkHealth = checkHealth;
window.initializeClient = initializeClient;
window.saveData = saveData;
window.syncData = syncData;
window.loginAdmin = loginAdmin;

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export {
  initializeClient,
  saveData,
  syncData,
  loginAdmin,
  refreshStats,
  deleteClient,
  viewClientData,
  checkHealth,
  formatBytes,
};
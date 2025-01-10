import { DB } from './db';

const API_URL = 'https://chroniclesync-worker.posix4e.workers.dev';
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

    const successMessage = document.querySelector('.success-message');
    successMessage.classList.remove('hidden');
    setTimeout(() => successMessage.classList.add('hidden'), 3000);
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
      row.innerHTML = `
                <td>${client.clientId}</td>
                <td>${new Date(client.lastSync).toLocaleString()}</td>
                <td>${formatBytes(client.dataSize)}</td>
                <td>
                    <button onclick="deleteClient('${client.clientId}')">Delete</button>
                    <button onclick="viewClientData('${client.clientId}')">View Data</button>
                </td>
            `;
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

async function triggerWorkflow(action, environment) {
  if (!confirm(`Are you sure you want to run ${action} on ${environment}?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/workflow`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer francesisthebest',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, environment })
    });

    if (!response.ok) {
      throw new Error('Failed to trigger workflow');
    }

    try {
      const result = await response.json();
      alert(`Workflow triggered: ${result.message}`);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  } catch (error) {
    alert(`Error triggering workflow: ${error.message}`);
  }
}

async function checkSystemStatus() {
  try {
    const response = await fetch(`${API_URL}/admin/status`, {
      headers: {
        'Authorization': 'Bearer francesisthebest'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    const status = await response.json();
        
    // Update production status
    document.getElementById('prodWorkerStatus').textContent = status.production.worker ? '✅ Online' : '❌ Offline';
    document.getElementById('prodDbStatus').textContent = status.production.database ? '✅ Connected' : '❌ Error';
    document.getElementById('prodStorageStatus').textContent = status.production.storage ? '✅ Available' : '❌ Error';
        
    // Update staging status
    document.getElementById('stagingWorkerStatus').textContent = status.staging.worker ? '✅ Online' : '❌ Offline';
    document.getElementById('stagingDbStatus').textContent = status.staging.database ? '✅ Connected' : '❌ Error';
    document.getElementById('stagingStorageStatus').textContent = status.staging.storage ? '✅ Available' : '❌ Error';
  } catch (error) {
    alert(`Error checking status: ${error.message}`);
  }
}

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
  triggerWorkflow,
  checkSystemStatus,
  formatBytes,
};
const API_URL = 'https://your-worker-url.workers.dev';
const db = new DB();

async function initializeClient() {
    const clientId = document.getElementById('clientId').value;
    if (!clientId) {
        alert('Please enter a client ID');
        return;
    }

    await db.init(clientId);
    const data = await db.getData();
    document.getElementById('dataInput').value = JSON.stringify(data, null, 2);
    document.getElementById('dataSection').classList.remove('hidden');

    // Try to sync with server
    await syncData();
}

async function saveData() {
    try {
        const data = JSON.parse(document.getElementById('dataInput').value);
        await db.setData(data);
        alert('Data saved locally');
    } catch (error) {
        alert('Invalid JSON data');
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
        const response = await fetch(`${API_URL}/admin`, {
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
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        alert(`Error fetching stats: ${error.message}`);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
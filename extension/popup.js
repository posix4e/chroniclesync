import { getClientId, setClientId, syncHistory } from './src/historySync';

document.addEventListener('DOMContentLoaded', async () => {
  const setupForm = document.getElementById('setup-form');
  const syncSection = document.getElementById('sync-section');
  const clientIdInput = document.getElementById('client-id');
  const saveClientIdBtn = document.getElementById('save-client-id');
  const syncHistoryBtn = document.getElementById('sync-history');
  const currentClientIdSpan = document.getElementById('current-client-id');
  const syncStatusP = document.getElementById('sync-status');

  const clientId = await getClientId();
  if (clientId) {
    setupForm.style.display = 'none';
    syncSection.style.display = 'block';
    currentClientIdSpan.textContent = clientId;
  }

  saveClientIdBtn.addEventListener('click', async () => {
    const newClientId = clientIdInput.value.trim();
    if (!newClientId) {
      syncStatusP.textContent = 'Please enter a valid Client ID';
      syncStatusP.className = 'error';
      return;
    }

    await setClientId(newClientId);
    setupForm.style.display = 'none';
    syncSection.style.display = 'block';
    currentClientIdSpan.textContent = newClientId;
  });

  syncHistoryBtn.addEventListener('click', async () => {
    try {
      syncStatusP.textContent = 'Syncing history...';
      syncStatusP.className = '';
      await syncHistory(await getClientId());
      syncStatusP.textContent = 'History synced successfully!';
      syncStatusP.className = 'success';
    } catch (error) {
      syncStatusP.textContent = `Error: ${error.message}`;
      syncStatusP.className = 'error';
    }
  });
});
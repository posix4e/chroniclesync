import { getApiUrl } from '../config';

export async function getHistory(days = 7) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const endTime = new Date().getTime();
  const startTime = endTime - (days * millisecondsPerDay);

  return new Promise((resolve) => {
    chrome.history.search({
      text: '',
      startTime,
      endTime,
      maxResults: 5000
    }, resolve);
  });
}

export async function syncHistory(clientId) {
  const history = await getHistory();
  const apiUrl = await getApiUrl();

  const response = await fetch(`${apiUrl}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-ID': clientId,
    },
    body: JSON.stringify({
      history: history.map(item => ({
        url: item.url,
        title: item.title,
        visitCount: item.visitCount,
        lastVisitTime: item.lastVisitTime,
      }))
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync history: ${response.statusText}`);
  }

  return response.json();
}

export async function getClientId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clientId'], (result) => {
      resolve(result.clientId);
    });
  });
}

export async function setClientId(clientId) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ clientId }, () => {
      resolve();
    });
  });
}
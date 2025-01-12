import { Router } from 'itty-router';
import { json } from './utils';

interface HistoryItem {
  url: string;
  title: string;
  visitTime: number;
  visitCount: number;
  browserId: string;
  syncTimestamp: number;
}

export const historyRouter = Router({ base: '/api/history' });

// Push history items from a browser
historyRouter.post('/push', async (request: Request, env: Env) => {
  const browserId = request.headers.get('X-Browser-ID');
  if (!browserId) {
    return json({ error: 'Browser ID is required' }, { status: 400 });
  }

  const historyItems: HistoryItem[] = await request.json();
  if (!Array.isArray(historyItems)) {
    return json({ error: 'Invalid history data format' }, { status: 400 });
  }

  // Store history items in KV
  const promises = historyItems.map(async (item) => {
    const key = `history:${item.url}:${item.visitTime}:${browserId}`;
    await env.HISTORY_KV.put(key, JSON.stringify(item), {
      expirationTtl: 60 * 60 * 24 * 30 // Store for 30 days
    });
  });

  await Promise.all(promises);
  return json({ success: true });
});

// Pull history items from other browsers
historyRouter.get('/pull', async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const since = Number(url.searchParams.get('since')) || 0;
  const browserId = url.searchParams.get('browserId');

  if (!browserId) {
    return json({ error: 'Browser ID is required' }, { status: 400 });
  }

  // List all history items
  const { keys } = await env.HISTORY_KV.list({
    prefix: 'history:',
  });

  const historyItems: HistoryItem[] = [];
  
  // Get all items and filter
  const promises = keys.map(async ({ name }) => {
    const item = await env.HISTORY_KV.get(name);
    if (item) {
      const historyItem: HistoryItem = JSON.parse(item);
      if (historyItem.syncTimestamp > since && historyItem.browserId !== browserId) {
        historyItems.push(historyItem);
      }
    }
  });

  await Promise.all(promises);

  // Sort by visit time and return
  historyItems.sort((a, b) => b.visitTime - a.visitTime);
  return json(historyItems);
});

// Clear history for a browser
historyRouter.delete('/clear', async (request: Request, env: Env) => {
  const browserId = request.headers.get('X-Browser-ID');
  if (!browserId) {
    return json({ error: 'Browser ID is required' }, { status: 400 });
  }

  const { keys } = await env.HISTORY_KV.list({
    prefix: 'history:',
  });

  const promises = keys.map(async ({ name }) => {
    const item = await env.HISTORY_KV.get(name);
    if (item) {
      const historyItem: HistoryItem = JSON.parse(item);
      if (historyItem.browserId === browserId) {
        await env.HISTORY_KV.delete(name);
      }
    }
  });

  await Promise.all(promises);
  return json({ success: true });
});
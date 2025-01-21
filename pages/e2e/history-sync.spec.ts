import { test, expect } from './utils/extension';

interface HistoryEntry {
  timestamp: number;
  action: string;
  data: unknown;
  clientId: string;
}

test.describe('History Sync', () => {
  test('should sync history between browser and extension', async ({ page, context }) => {
    // Open extension popup directly from extension directory
    const popupPage = await context.newPage();
    await popupPage.goto(`file://${process.cwd()}/../extension/popup.html`);

    // Wait for React to mount and render content
    await popupPage.waitForLoadState('networkidle');
    await popupPage.waitForTimeout(1000);

    // Inject test data through the extension
    await popupPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      await db.init('test-client-1');
      await db.setData({ key1: 'value1' });
      await db.setData({ key1: 'value2' });
    });

    // Verify history entries were created
    const history = await popupPage.evaluate<Promise<HistoryEntry[]>>(async () => {
      const db = (window as any).chronicleSync.db;
      return await db.getHistory();
    });

    expect(history).toHaveLength(2);
    expect(history[0].action).toBe('setData');
    expect(history[0].data).toEqual({ key1: 'value1' });
    expect(history[1].action).toBe('setData');
    expect(history[1].data).toEqual({ key1: 'value2' });

    // Open a new tab and verify history is synced
    const newPage = await context.newPage();
    await newPage.goto(`file://${process.cwd()}/../extension/popup.html`);
    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(1000);

    // Verify history is available in the new tab
    const syncedHistory = await newPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      await db.init('test-client-1');
      return await db.getHistory();
    });

    expect(syncedHistory).toHaveLength(2);
    expect(syncedHistory[0].data).toEqual({ key1: 'value1' });
    expect(syncedHistory[1].data).toEqual({ key1: 'value2' });

    // Add new data in the new tab
    await newPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      await db.setData({ key1: 'value3' });
    });

    // Verify history is updated in both tabs
    const updatedHistory = await popupPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      return await db.getHistory();
    });

    expect(updatedHistory).toHaveLength(3);
    expect(updatedHistory[2].data).toEqual({ key1: 'value3' });

    // Test history filtering by timestamp
    const recentHistory = await popupPage.evaluate(async () => {
      const db = (window as any).chronicleSync.db;
      const oneMinuteAgo = Date.now() - 60000;
      return await db.getHistory(oneMinuteAgo);
    });

    expect(recentHistory.length).toBeLessThanOrEqual(3);
    expect(recentHistory[recentHistory.length - 1].data).toEqual({ key1: 'value3' });
  });

  test('should handle concurrent updates', async ({ page, context }) => {
    const popupPage1 = await context.newPage();
    const popupPage2 = await context.newPage();

    await Promise.all([
      popupPage1.goto(`file://${process.cwd()}/../extension/popup.html`),
      popupPage2.goto(`file://${process.cwd()}/../extension/popup.html`)
    ]);

    await Promise.all([
      popupPage1.waitForLoadState('networkidle'),
      popupPage2.waitForLoadState('networkidle')
    ]);

    // Initialize DBs with different client IDs
    await Promise.all([
      popupPage1.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.init('test-client-1');
      }),
      popupPage2.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.init('test-client-2');
      })
    ]);

    // Make concurrent updates
    await Promise.all([
      popupPage1.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.setData({ from: 'client1' });
      }),
      popupPage2.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        await db.setData({ from: 'client2' });
      })
    ]);

    // Wait for sync
    await page.waitForTimeout(1000);

    // Verify history in both clients
    const [history1, history2] = await Promise.all([
      popupPage1.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      }),
      popupPage2.evaluate(async () => {
        const db = (window as any).chronicleSync.db;
        return await db.getHistory();
      })
    ]);

    // Both clients should see all updates
    expect(history1).toHaveLength(2);
    expect(history2).toHaveLength(2);

    // Verify client IDs are preserved
    const clientIds1 = new Set(history1.map((entry: { clientId: string }) => entry.clientId));
    const clientIds2 = new Set(history2.map((entry: { clientId: string }) => entry.clientId));

    expect(clientIds1).toEqual(clientIds2);
    expect(clientIds1.size).toBe(2);
    expect(clientIds1.has('test-client-1')).toBe(true);
    expect(clientIds1.has('test-client-2')).toBe(true);
  });
});
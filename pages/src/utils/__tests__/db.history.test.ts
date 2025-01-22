import { DB } from '../db';

describe('DB History', () => {
  let db: DB;
  const TEST_CLIENT_ID = 'test-client';

  beforeEach(async () => {
    // Clear IndexedDB before each test
    await new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(`sync_${TEST_CLIENT_ID}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
    
    db = new DB();
    await db.init(TEST_CLIENT_ID);
  });

  afterEach(() => {
    db.close();
  });

  it('should track history when setting data', async () => {
    const testData = { key: 'value' };
    await db.setData(testData);

    const history = await db.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe('setData');
    expect(history[0].data).toEqual(testData);
    expect(history[0].clientId).toBe(TEST_CLIENT_ID);
    expect(history[0].timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('should retrieve history entries after timestamp', async () => {
    const data1 = { key: 'value1' };
    const data2 = { key: 'value2' };

    await db.setData(data1);
    await new Promise(resolve => setTimeout(resolve, 100));
    const midTimestamp = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    await db.setData(data2);

    const allHistory = await db.getHistory();
    expect(allHistory).toHaveLength(2);

    const recentHistory = await db.getHistory(midTimestamp);
    expect(recentHistory).toHaveLength(1);
    expect(recentHistory[0].data).toEqual(data2);
  });

  it('should add custom history entries', async () => {
    const customAction = 'customAction';
    const customData = { custom: 'data' };

    await db.addHistoryEntry(customAction, customData);

    const history = await db.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].action).toBe(customAction);
    expect(history[0].data).toEqual(customData);
  });

  it('should maintain history order', async () => {
    const entries = [
      { key: 'value1' },
      { key: 'value2' },
      { key: 'value3' }
    ];

    for (const entry of entries) {
      await db.setData(entry);
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const history = await db.getHistory();
    expect(history).toHaveLength(entries.length);

    // Verify order is ascending by timestamp
    const timestamps = history.map(entry => entry.timestamp);
    const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
    expect(timestamps).toEqual(sortedTimestamps);

    // Verify data matches in order
    history.forEach((entry, index) => {
      expect(entry.data).toEqual(entries[index]);
    });
  });

  it('should handle errors gracefully', async () => {
    // Test uninitialized DB
    const uninitializedDb = new DB();
    await expect(uninitializedDb.getHistory()).rejects.toThrow('Database not initialized');
    await expect(uninitializedDb.addHistoryEntry('test', {})).rejects.toThrow('Database not initialized');

    // Test with invalid data
    const circularRef: { self?: unknown } = {};
    circularRef.self = circularRef;
    await expect(db.setData(circularRef)).rejects.toThrow();
  });
});
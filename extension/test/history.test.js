describe('History Storage', () => {
  let db;
  const testUrl = 'https://example.com';
  const testTitle = 'Example Page';
  const testTimestamp = Date.now();

  beforeAll(async () => {
    // Mock chrome API
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      alarms: {
        create: jest.fn(),
        clear: jest.fn().mockResolvedValue()
      }
    };

    // Set up IndexedDB
    const request = indexedDB.open('chronicleSync', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      store.createIndex('urlTime', ['url', 'timestamp'], { unique: true });
      store.createIndex('timestamp', 'timestamp');
    };
    db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });

  afterAll(() => {
    db.close();
  });

  it('should store history entry without duplicates', async () => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    
    // Add first entry
    await new Promise((resolve, reject) => {
      const request = store.add({ url: testUrl, title: testTitle, timestamp: testTimestamp });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Try to add duplicate
    const duplicatePromise = new Promise((resolve, reject) => {
      const request = store.add({ url: testUrl, title: testTitle, timestamp: testTimestamp });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await expect(duplicatePromise).rejects.toThrow();

    // Verify only one entry exists
    const count = await new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
    });

    expect(count).toBe(1);
  });

  it('should retrieve entries within retention period', async () => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const now = Date.now();
    
    // Add entries with different timestamps
    await Promise.all([
      store.add({ url: 'https://test1.com', title: 'Test 1', timestamp: now }),
      store.add({ url: 'https://test2.com', title: 'Test 2', timestamp: now - (25 * 24 * 60 * 60 * 1000) }), // 25 days ago
      store.add({ url: 'https://test3.com', title: 'Test 3', timestamp: now - (35 * 24 * 60 * 60 * 1000) }), // 35 days ago
    ]);

    const cutoffTime = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    const index = store.index('timestamp');
    
    const entries = await new Promise((resolve) => {
      const request = index.getAll(IDBKeyRange.lowerBound(cutoffTime));
      request.onsuccess = () => resolve(request.result);
    });

    expect(entries.length).toBe(2); // Should only include entries within last 30 days
    expect(entries.map(e => e.url)).toContain('https://test1.com');
    expect(entries.map(e => e.url)).toContain('https://test2.com');
    expect(entries.map(e => e.url)).not.toContain('https://test3.com');
  });
});
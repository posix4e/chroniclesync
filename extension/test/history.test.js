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

  it('should handle concurrent modifications correctly', async () => {
    const transaction1 = db.transaction(['history'], 'readwrite');
    const transaction2 = db.transaction(['history'], 'readwrite');
    const store1 = transaction1.objectStore('history');
    const store2 = transaction2.objectStore('history');
    const now = Date.now();

    // Try to add same URL with different timestamps concurrently
    const promises = [
      new Promise((resolve, reject) => {
        const request = store1.add({ url: 'https://concurrent.com', title: 'Test Concurrent 1', timestamp: now });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = store2.add({ url: 'https://concurrent.com', title: 'Test Concurrent 2', timestamp: now + 1000 });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ];

    // Both operations should succeed as they have different timestamps
    await expect(Promise.all(promises)).resolves.toBeDefined();

    // Verify both entries exist
    const entries = await new Promise((resolve) => {
      const request = store1.index('urlTime').getAll('https://concurrent.com');
      request.onsuccess = () => resolve(request.result);
    });

    expect(entries.length).toBe(2);
    expect(entries[0].timestamp).not.toBe(entries[1].timestamp);
  });

  it('should handle network failures during sync', async () => {
    // Mock fetch to simulate network failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const config = {
      config: {
        retentionDays: 30,
        apiEndpoint: 'https://api.example.com',
        syncIntervalMinutes: 30
      },
      clientId: 'test-client'
    };

    // Mock chrome.storage.sync.get to return our test config
    global.chrome.storage.sync.get.mockResolvedValue(config);

    // Add some test entries
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const now = Date.now();
    
    await Promise.all([
      store.add({ url: 'https://test1.com', title: 'Test 1', timestamp: now }),
      store.add({ url: 'https://test2.com', title: 'Test 2', timestamp: now - 1000 })
    ]);

    // Try to sync
    const syncPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.textContent = `
        async function testSync() {
          try {
            await syncWithServer();
            return 'completed';
          } catch (error) {
            return error.message;
          }
        }
        testSync().then(resolve).catch(reject);
      `;
      document.body.appendChild(script);
    });

    const result = await syncPromise;
    expect(result).toContain('error');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle data conflicts between devices', async () => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const now = Date.now();
    
    // Simulate entries from different devices with same URL but different metadata
    const device1Entry = { url: 'https://conflict.com', title: 'Device 1 Title', timestamp: now, deviceId: 'device1' };
    const device2Entry = { url: 'https://conflict.com', title: 'Device 2 Title', timestamp: now, deviceId: 'device2' };

    // Add entries
    await Promise.all([
      store.add(device1Entry),
      store.add(device2Entry).catch(() => {
        // Expected to fail due to same timestamp
        return store.add({ ...device2Entry, timestamp: now + 1 });
      })
    ]);

    // Verify entries
    const entries = await new Promise((resolve) => {
      const request = store.index('urlTime').getAll('https://conflict.com');
      request.onsuccess = () => resolve(request.result);
    });

    // Should have both entries with different timestamps
    expect(entries.length).toBe(2);
    expect(entries[0].deviceId).not.toBe(entries[1].deviceId);
    expect(entries[0].timestamp).not.toBe(entries[1].timestamp);
  });
});
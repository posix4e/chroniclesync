import { HistoryStore } from '../src/db/HistoryStore';
import { EncryptionService } from '../src/services/EncryptionService';
import { HistoryEntry } from '../src/types';

describe('HistoryStore', () => {
  let historyStore: HistoryStore;
  let encryptionService: EncryptionService;

  const testMnemonic = 'test test test test test test test test test test test junk';
  const testEntry: Omit<HistoryEntry, 'syncStatus'> = {
    visitId: '123',
    url: 'https://example.com',
    title: 'Example Website',
    visitTime: Date.now(),
    lastVisitTime: Date.now()
  };

  beforeEach(async () => {
    // Set up mock IndexedDB
    const { setupIndexedDBMock } = await import('./mocks/indexedDB');
    setupIndexedDBMock();

    historyStore = new HistoryStore();
    await historyStore.init();

    encryptionService = await EncryptionService.create(testMnemonic);
  });

  it('should store unencrypted entries when encryption service is not set', async () => {
    await historyStore.addEntry(testEntry);
    const entries = await historyStore.getEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(testEntry.url);
    expect(entries[0].title).toBe(testEntry.title);
    expect(entries[0].encrypted).toBe(false);
  });

  it('should store and retrieve encrypted entries', async () => {
    historyStore.setEncryptionService(encryptionService);
    await historyStore.addEntry(testEntry);
    const entries = await historyStore.getEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(testEntry.url);
    expect(entries[0].title).toBe(testEntry.title);
    expect(entries[0].encrypted).toBe(true);
    expect(entries[0].encryptedData).toBeTruthy();
    expect(entries[0].encryptedData!.url.ciphertext).toBeTruthy();
    expect(entries[0].encryptedData!.url.iv).toBeTruthy();
  });

  it('should handle multiple entries with encryption', async () => {
    historyStore.setEncryptionService(encryptionService);

    const entries = [
      { ...testEntry, visitId: '1', url: 'https://example1.com', title: 'Example 1' },
      { ...testEntry, visitId: '2', url: 'https://example2.com', title: 'Example 2' },
      { ...testEntry, visitId: '3', url: 'https://example3.com', title: 'Example 3' }
    ];

    await Promise.all(entries.map(entry => historyStore.addEntry(entry)));
    const storedEntries = await historyStore.getEntries();

    expect(storedEntries).toHaveLength(3);
    storedEntries.forEach((entry, i) => {
      expect(entry.url).toBe(entries[i].url);
      expect(entry.title).toBe(entries[i].title);
      expect(entry.encrypted).toBe(true);
      expect(entry.encryptedData).toBeTruthy();
    });
  });

  it('should handle unsynced entries with encryption', async () => {
    historyStore.setEncryptionService(encryptionService);
    await historyStore.addEntry(testEntry);

    const unsyncedEntries = await historyStore.getUnsyncedEntries();
    expect(unsyncedEntries).toHaveLength(1);
    expect(unsyncedEntries[0].url).toBe(testEntry.url);
    expect(unsyncedEntries[0].title).toBe(testEntry.title);
    expect(unsyncedEntries[0].syncStatus).toBe('pending');
    expect(unsyncedEntries[0].encrypted).toBe(true);
  });

  it('should mark entries as synced', async () => {
    historyStore.setEncryptionService(encryptionService);
    await historyStore.addEntry(testEntry);

    let unsyncedEntries = await historyStore.getUnsyncedEntries();
    expect(unsyncedEntries).toHaveLength(1);

    await historyStore.markAsSynced(testEntry.visitId);

    unsyncedEntries = await historyStore.getUnsyncedEntries();
    expect(unsyncedEntries).toHaveLength(0);
  });

  it('should handle switching encryption on and off', async () => {
    // Add unencrypted entry
    await historyStore.addEntry(testEntry);
    let entries = await historyStore.getEntries();
    expect(entries[0].encrypted).toBe(false);

    // Enable encryption and add another entry
    historyStore.setEncryptionService(encryptionService);
    await historyStore.addEntry({ ...testEntry, visitId: '456' });
    entries = await historyStore.getEntries();

    expect(entries).toHaveLength(2);
    expect(entries[0].encrypted).toBe(false);
    expect(entries[1].encrypted).toBe(true);
  });
});
import { HistorySync } from '../src/services/HistorySync';
import { Settings } from '../src/settings/Settings';
import { EncryptionService } from '../src/services/EncryptionService';
import { HistoryEntry } from '../src/types';

describe('HistorySync', () => {
  let historySync: HistorySync;
  let settings: Settings;
  let encryptionService: EncryptionService;
  const testMnemonic = 'test test test test test test test test test test test junk';

  beforeEach(async () => {
    // Clear IndexedDB before each test
    const databases = await window.indexedDB.databases();
    await Promise.all(
      databases.map(db => window.indexedDB.deleteDatabase(db.name!))
    );

    // Mock chrome.history API
    global.chrome = {
      history: {
        search: jest.fn(),
        getVisits: jest.fn(),
        onVisited: {
          addListener: jest.fn()
        }
      },
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({ clientId: 'test-client' })
        }
      }
    } as any;

    settings = new Settings();
    encryptionService = new EncryptionService(testMnemonic);
    historySync = new HistorySync(settings, encryptionService);
    await historySync.init();
  });

  it('should initialize with encryption service', async () => {
    const testEntry: HistoryEntry = {
      visitId: '123',
      url: 'https://example.com',
      title: 'Example Website',
      visitTime: Date.now(),
      lastVisitTime: Date.now(),
      platform: 'test',
      browserName: 'test',
      syncStatus: 'pending'
    };

    // Mock chrome.history.search response
    (chrome.history.search as jest.Mock).mockResolvedValue([{
      url: testEntry.url,
      title: testEntry.title,
      lastVisitTime: testEntry.lastVisitTime
    }]);

    // Mock chrome.history.getVisits response
    (chrome.history.getVisits as jest.Mock).mockResolvedValue([{
      visitId: testEntry.visitId,
      visitTime: testEntry.visitTime
    }]);

    // Trigger initial history load
    await historySync.init();

    // Get stored entries
    const entries = await historySync.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].encrypted).toBe(true);
    expect(entries[0].encryptedData).toBeTruthy();
    expect(entries[0].url).toBe(testEntry.url);
    expect(entries[0].title).toBe(testEntry.title);
  });

  it('should sync encrypted entries', async () => {
    const testEntry: HistoryEntry = {
      visitId: '123',
      url: 'https://example.com',
      title: 'Example Website',
      visitTime: Date.now(),
      lastVisitTime: Date.now(),
      platform: 'test',
      browserName: 'test',
      syncStatus: 'pending'
    };

    // Add entry to history
    await historySync.getHistory();

    // Mock sync response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Start sync
    await historySync.startSync();

    // Verify sync request
    expect(fetch).toHaveBeenCalled();
    const [url, options] = (fetch as jest.Mock).mock.calls[0];
    const payload = JSON.parse(options.body);
    
    expect(payload.encrypted).toBe(true);
    expect(payload.history[0].url.ciphertext).toBeTruthy();
    expect(payload.history[0].url.iv).toBeTruthy();
    expect(payload.history[0].title.ciphertext).toBeTruthy();
    expect(payload.history[0].title.iv).toBeTruthy();
  });

  it('should handle encryption errors gracefully', async () => {
    // Create invalid encryption service
    const invalidEncryptionService = {
      encrypt: jest.fn().mockRejectedValue(new Error('Encryption failed')),
      decrypt: jest.fn().mockRejectedValue(new Error('Decryption failed'))
    };

    historySync = new HistorySync(settings, invalidEncryptionService as any);
    await historySync.init();

    const testEntry: HistoryEntry = {
      visitId: '123',
      url: 'https://example.com',
      title: 'Example Website',
      visitTime: Date.now(),
      lastVisitTime: Date.now(),
      platform: 'test',
      browserName: 'test',
      syncStatus: 'pending'
    };

    // Mock chrome.history.search response
    (chrome.history.search as jest.Mock).mockResolvedValue([{
      url: testEntry.url,
      title: testEntry.title,
      lastVisitTime: testEntry.lastVisitTime
    }]);

    // Mock chrome.history.getVisits response
    (chrome.history.getVisits as jest.Mock).mockResolvedValue([{
      visitId: testEntry.visitId,
      visitTime: testEntry.visitTime
    }]);

    // Expect sync to fail gracefully
    await expect(historySync.startSync()).rejects.toThrow();
  });
});
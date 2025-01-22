import { SimpleHistoryManager } from '../simple-history';
import { DB } from '../db';

jest.mock('../db');

describe('SimpleHistoryManager', () => {
  let db: jest.Mocked<DB>;
  let manager: SimpleHistoryManager;

  beforeEach(() => {
    db = {
      clientId: 'test-client',
      addHistoryEntry: jest.fn(),
      getHistory: jest.fn(),
      markEntriesAsSynced: jest.fn()
    } as unknown as jest.Mocked<DB>;

    manager = new SimpleHistoryManager(db);
  });

  it('should add history entry', async () => {
    const url = 'https://example.com';
    const title = 'Example';

    await manager.addEntry(url, title);

    expect(db.addHistoryEntry).toHaveBeenCalledWith('navigation', expect.objectContaining({
      url,
      title,
      synced: false
    }));
  });

  it('should get history entries', async () => {
    const mockEntries = [
      {
        timestamp: 123,
        action: 'navigation',
        data: { url: 'https://example.com', title: 'Example' },
        synced: true
      }
    ];

    (db.getHistory as jest.Mock).mockResolvedValue(mockEntries);

    const entries = await manager.getEntries();

    expect(entries).toEqual([{
      url: 'https://example.com',
      title: 'Example',
      timestamp: 123,
      synced: true
    }]);
  });
});
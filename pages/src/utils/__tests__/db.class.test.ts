import { DB } from '../db';
import { HistoryItem } from '../../types';

describe('DB Class', () => {
  let db: DB;

  beforeEach(async () => {
    db = new DB();
    await db.init('test-client');
  });

  afterEach(async () => {
    await db.clearHistory();
  });

  it('should initialize with client ID', () => {
    expect(db.clientId).toBe('test-client');
  });

  it('should store and retrieve data', async () => {
    const testData = { key: 'value' };
    await db.setData(testData);
    const retrieved = await db.getData();
    expect(retrieved).toEqual(testData);
  });

  describe('History Management', () => {
    const testHistoryItems: HistoryItem[] = [
      {
        id: '1',
        url: 'https://example.com',
        title: 'Example Site',
        visitTime: 1625097600000,
        typedCount: 5,
        lastVisitTime: 1625097600000,
      },
      {
        id: '2',
        url: 'https://test.com',
        title: 'Test Site',
        visitTime: 1625184000000,
        typedCount: 3,
        lastVisitTime: 1625184000000,
      },
    ];

    beforeEach(async () => {
      await db.clearHistory();
    });

    it('should add and retrieve history items', async () => {
      await db.addHistoryItems(testHistoryItems);
      const items = await db.getHistoryItems();
      expect(items).toHaveLength(2);
      expect(items).toEqual(expect.arrayContaining(testHistoryItems));
    });

    it('should retrieve history items by time range', async () => {
      await db.addHistoryItems(testHistoryItems);
      const items = await db.getHistoryItems(1625097600000, 1625097600001);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(testHistoryItems[0]);
    });

    it('should retrieve history items by URL', async () => {
      await db.addHistoryItems(testHistoryItems);
      const items = await db.getHistoryByUrl('https://example.com');
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(testHistoryItems[0]);
    });

    it('should clear history', async () => {
      await db.addHistoryItems(testHistoryItems);
      await db.clearHistory();
      const items = await db.getHistoryItems();
      expect(items).toHaveLength(0);
    });

    it('should handle duplicate IDs by updating existing entries', async () => {
      await db.addHistoryItems([testHistoryItems[0]]);
      const updatedItem = {
        ...testHistoryItems[0],
        title: 'Updated Title',
      };
      await db.addHistoryItems([updatedItem]);
      const items = await db.getHistoryItems();
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Updated Title');
    });
  });
});
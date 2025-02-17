import { EncryptedHistoryService } from '../src/services/encryptedHistory';

describe('EncryptedHistoryService', () => {
  const testClientId = 'test-client-123';
  let service;

  beforeEach(() => {
    service = new EncryptedHistoryService(testClientId);
  });

  test('encrypts history item correctly', async () => {
    const testItem = {
      url: 'https://example.com',
      title: 'Test Page',
      visitTime: Date.now()
    };

    const encryptedItem = await service.encryptHistoryItem(testItem);

    // Verify structure
    expect(encryptedItem).toHaveProperty('visitTime', testItem.visitTime);
    expect(encryptedItem).toHaveProperty('encryptedData');
    expect(encryptedItem.encryptedData).toHaveProperty('version');
    expect(encryptedItem.encryptedData).toHaveProperty('iv');
    expect(encryptedItem.encryptedData).toHaveProperty('data');
    expect(encryptedItem.encryptedData).toHaveProperty('tag');

    // Verify the data is actually encrypted (should be base64)
    expect(encryptedItem.encryptedData.data).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(encryptedItem.encryptedData.iv).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(encryptedItem.encryptedData.tag).toMatch(/^[A-Za-z0-9+/=]+$/);

    // Verify encrypted data is different from original
    expect(encryptedItem.encryptedData.data).not.toContain(testItem.url);
    expect(encryptedItem.encryptedData.data).not.toContain(testItem.title);

    // Verify decryption works
    const decryptedItem = await service.decryptHistoryItem(encryptedItem);
    expect(decryptedItem).toEqual(testItem);
  });

  test('encrypts multiple history items', async () => {
    const testItems = [
      {
        url: 'https://example.com/1',
        title: 'Test Page 1',
        visitTime: Date.now()
      },
      {
        url: 'https://example.com/2',
        title: 'Test Page 2',
        visitTime: Date.now() + 1000
      }
    ];

    const encryptedItems = await service.encryptHistoryItems(testItems);

    // Verify all items are encrypted
    expect(encryptedItems).toHaveLength(2);
    encryptedItems.forEach((item, index) => {
      expect(item).toHaveProperty('visitTime', testItems[index].visitTime);
      expect(item).toHaveProperty('encryptedData');
      expect(item.encryptedData.data).not.toContain(testItems[index].url);
      expect(item.encryptedData.data).not.toContain(testItems[index].title);
    });

    // Verify decryption works for all items
    const decryptedItems = await service.decryptHistoryItems(encryptedItems);
    expect(decryptedItems).toEqual(testItems);
  });
});
import { HistoryManager } from '../history';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;
  const mockHistoryItems = [
    {
      id: '1',
      url: 'https://example.com',
      title: 'Example',
      lastVisitTime: Date.now(),
      visitCount: 1,
      typedCount: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    historyManager = new HistoryManager();
  });

  it('should sync history items', async () => {
    (chrome.history.search as jest.Mock).mockImplementation((options, callback) => {
      callback(mockHistoryItems);
    });

    await historyManager.syncHistory();

    expect(chrome.history.search).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '',
        maxResults: 1000
      }),
      expect.any(Function)
    );

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'PROCESS_HISTORY_ITEM',
      item: mockHistoryItems[0]
    });
  });

  it('should handle empty history', async () => {
    (chrome.history.search as jest.Mock).mockImplementation((options, callback) => {
      callback([]);
    });

    await historyManager.syncHistory();

    expect(chrome.history.search).toHaveBeenCalled();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle search errors', async () => {
    (chrome.history.search as jest.Mock).mockImplementation((options, callback) => {
      throw new Error('Search failed');
    });

    await expect(historyManager.syncHistory()).rejects.toThrow('Search failed');
  });
});
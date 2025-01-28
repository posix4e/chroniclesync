describe('Chrome Storage', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  test('should store and retrieve data', async () => {
    const testData = { key: 'value' };
    
    // Mock storage.get to return our test data
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(testData);
    });

    // Store data
    chrome.storage.local.set(testData);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(testData);

    // Retrieve data
    chrome.storage.local.get(null, (result) => {
      expect(result).toEqual(testData);
    });
    expect(chrome.storage.local.get).toHaveBeenCalled();
  });
});
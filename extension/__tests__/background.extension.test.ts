describe('Background Script', () => {
  beforeEach(() => {
    // Clear mock calls and module cache before each test
    jest.resetModules();
    chrome.tabs.onUpdated.addListener.mockClear();
    console.log = jest.fn();
  });

  test('should register tab update listener', () => {
    // Import background script
    require('../background');
    
    // Verify listener was registered
    expect(chrome.tabs.onUpdated.addListener).toHaveBeenCalled();
  });

  test('should log URL changes', () => {
    // Set up mock listener that immediately calls the callback
    chrome.tabs.onUpdated.addListener.mockImplementation(callback => {
      callback(1, { url: 'https://example.com' }, {});
    });
    
    // Run the script
    require('../background');
    
    // Verify URL was logged
    expect(console.log).toHaveBeenCalledWith('Navigation to:', 'https://example.com');
  });

  test('should not log when URL does not change', () => {
    // Set up mock listener that immediately calls the callback
    chrome.tabs.onUpdated.addListener.mockImplementation(callback => {
      callback(1, { title: 'New Title' }, {});
    });
    
    // Run the script
    require('../background');
    
    // Verify nothing was logged
    expect(console.log).not.toHaveBeenCalled();
  });
});
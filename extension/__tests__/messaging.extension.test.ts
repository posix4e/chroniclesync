describe('Message Passing', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    chrome.runtime.sendMessage.mockClear();
    chrome.runtime.onMessage.addListener.mockClear();
  });

  test('should send and receive messages', () => {
    const testMessage = { type: 'TEST', data: 'test data' };
    const mockCallback = jest.fn();

    // Add message listener
    chrome.runtime.onMessage.addListener(mockCallback);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(mockCallback);

    // Send message
    chrome.runtime.sendMessage(testMessage);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage);
  });
});
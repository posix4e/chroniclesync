import { getClientIdFromExtension } from '../extension-messaging';

// Mock the chrome.runtime.sendMessage for testing
const createMockChrome = (sendMessageMock: jest.Mock) => {
  const mockRuntime = {
    sendMessage: sendMessageMock,
    // Add other required properties as undefined
    connect: undefined,
    connectNative: undefined,
    getBackgroundPage: undefined,
    getContexts: undefined,
  } as unknown as typeof chrome.runtime;

  return {
    runtime: mockRuntime,
    // Add other required Chrome APIs as undefined
    cast: undefined,
    accessibilityFeatures: undefined,
    action: undefined,
    alarms: undefined,
  } as unknown as typeof chrome;
};
const mockSendMessage = (response?: unknown) => {
  const sendMessage = jest.fn();
  if (response instanceof Error) {
    sendMessage.mockRejectedValue(response);
  } else {
    sendMessage.mockResolvedValue(response);
  }
  return sendMessage;
};

describe('getClientIdFromExtension', () => {
  const originalChrome = global.chrome;

  beforeEach(() => {
    // Reset chrome global before each test
    delete (global as { chrome?: typeof chrome }).chrome;
  });

  afterEach(() => {
    // Restore original chrome global after each test
    (global as { chrome?: typeof chrome }).chrome = originalChrome;
  });

  it('returns null when chrome runtime is not available', async () => {
    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns null when sendMessage throws an error', async () => {
    (global as { chrome?: typeof chrome }).chrome = createMockChrome(
      mockSendMessage(new Error('Extension not installed'))
    );

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns null when response has no clientId', async () => {
    (global as { chrome?: typeof chrome }).chrome = createMockChrome(
      mockSendMessage({})
    );

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns clientId from extension response', async () => {
    const mockClientId = 'test-client-123';
    (global as { chrome?: typeof chrome }).chrome = createMockChrome(
      mockSendMessage({ clientId: mockClientId })
    );

    const result = await getClientIdFromExtension();
    expect(result).toBe(mockClientId);
  });
});
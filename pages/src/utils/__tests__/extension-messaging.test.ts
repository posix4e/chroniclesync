import { getClientIdFromExtension } from '../extension-messaging';

type MockChromeRuntime = {
  sendMessage: jest.Mock;
};

type MockChromeGlobal = {
  runtime: MockChromeRuntime;
};

// Mock the chrome.runtime.sendMessage for testing
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
    delete (global as { chrome?: MockChromeGlobal }).chrome;
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
    (global as { chrome?: MockChromeGlobal }).chrome = {
      runtime: {
        sendMessage: mockSendMessage(new Error('Extension not installed'))
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns null when response has no clientId', async () => {
    (global as { chrome?: MockChromeGlobal }).chrome = {
      runtime: {
        sendMessage: mockSendMessage({})
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns clientId from extension response', async () => {
    const mockClientId = 'test-client-123';
    (global as { chrome?: MockChromeGlobal }).chrome = {
      runtime: {
        sendMessage: mockSendMessage({ clientId: mockClientId })
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBe(mockClientId);
  });
});
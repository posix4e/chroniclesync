import { getClientIdFromExtension } from '../extension-messaging';

type PartialChrome = {
  runtime?: {
    sendMessage?: jest.Mock;
  };
};

describe('getClientIdFromExtension', () => {
  const originalChrome = global.chrome;

  beforeEach(() => {
    // Reset chrome global before each test
    (global as { chrome?: PartialChrome }).chrome = undefined;
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
    (global as { chrome: PartialChrome }).chrome = {
      runtime: {
        sendMessage: jest.fn().mockRejectedValue(new Error('Extension not installed'))
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns null when response has no clientId', async () => {
    (global as { chrome: PartialChrome }).chrome = {
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({})
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBeNull();
  });

  it('returns clientId from extension response', async () => {
    const mockClientId = 'test-client-123';
    (global as { chrome: PartialChrome }).chrome = {
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({ clientId: mockClientId })
      }
    };

    const result = await getClientIdFromExtension();
    expect(result).toBe(mockClientId);
  });
});
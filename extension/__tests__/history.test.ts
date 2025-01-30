import { describe, it, expect, beforeEach, vi } from 'vitest';
import { historyManager } from '../src/history';

vi.mock('../src/config', () => ({
  config: {
    workerUrl: 'http://localhost:53217'
  }
}));

interface MockStorage {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

interface MockChrome {
  storage: {
    local: MockStorage;
  };
}

interface MockGlobal {
  chrome: MockChrome;
  fetch: ReturnType<typeof vi.fn>;
}

const mockStorage: MockStorage = {
  get: vi.fn(),
  set: vi.fn()
};

(global as unknown as MockGlobal).chrome = {
  storage: {
    local: mockStorage
  }
};

// Mock fetch
(global as unknown as MockGlobal).fetch = vi.fn();

describe('HistoryManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.get.mockImplementation(() => Promise.resolve({}));
    (global as any).fetch.mockImplementation(() => Promise.resolve({ ok: true }));
  });

  it('should store client ID', async () => {
    const clientId = 'test-client-123';
    await historyManager.setClientId(clientId);
    expect(mockStorage.set).toHaveBeenCalledWith({ clientId });
  });

  it('should retrieve client ID', async () => {
    const clientId = 'test-client-456';
    mockStorage.get.mockImplementation(() => Promise.resolve({ clientId }));
    const result = await historyManager.getClientId();
    expect(result).toBe(clientId);
  });

  it('should queue history entries for upload', async () => {
    const clientId = 'test-client-789';
    const url = 'https://example.com';
    const title = 'Example Page';

    await historyManager.setClientId(clientId);
    await historyManager.addToHistory(url, title);

    expect(fetch).toHaveBeenCalledWith('http://localhost:53217/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining(clientId)
    });
  });

  it('should handle upload failures', async () => {
    vi.useFakeTimers();
    const clientId = 'test-client-789';
    const url = 'https://example.com';
    const title = 'Example Page';

    (global as any).fetch.mockImplementation(() => Promise.resolve({ ok: false }));
    
    await historyManager.setClientId(clientId);
    await historyManager.addToHistory(url, title);
    await historyManager.addToHistory(url + '/2', title + ' 2');

    // Should retry the failed upload
    (global as any).fetch.mockImplementation(() => Promise.resolve({ ok: true }));
    
    // Advance timers to trigger retry
    vi.advanceTimersByTime(5500);
    
    expect(fetch).toHaveBeenCalledTimes(3); // Initial 2 failed attempts + 1 successful retry
  });
});
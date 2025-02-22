import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackgroundService } from '../src/background';

// Mock chrome API
const mockChrome = {
  history: {
    onVisited: {
      addListener: vi.fn()
    },
    search: vi.fn(),
    getVisits: vi.fn()
  },
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined)
    }
  },
  runtime: {
    onMessage: {
      addListener: vi.fn()
    }
  }
};

// Set up global chrome object
global.chrome = mockChrome as unknown as typeof chrome;

// Mock Settings class
vi.mock('../src/settings/Settings', () => ({
  Settings: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock HistorySync class
vi.mock('../src/services/HistorySync', () => ({
  HistorySync: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    getHistory: vi.fn().mockResolvedValue([]),
    startSync: vi.fn().mockResolvedValue(undefined),
    stopSync: vi.fn()
  }))
}));

describe('BackgroundService', () => {
  let messageListener: (
    request: { type: string; limit?: number },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void;
  let service: BackgroundService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Capture the message listener when it's registered
    mockChrome.runtime.onMessage.addListener.mockImplementation((listener) => {
      messageListener = listener;
    });

    // Initialize service
    service = new BackgroundService();
    await service.init();

    // Verify that the message listener was registered
    expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(messageListener).toBeDefined();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle getHistory message correctly', async () => {
    const sender = {};
    const sendResponse = vi.fn();

    // Create a promise that resolves when sendResponse is called
    const responsePromise = new Promise<void>((resolve) => {
      sendResponse.mockImplementation(() => {
        resolve();
        return true;
      });
    });

    // Call the message listener with a getHistory message
    const handled = messageListener(
      { type: 'getHistory', limit: 50 },
      sender,
      sendResponse
    );

    // Should return true to keep the message port open
    expect(handled).toBe(true);

    // Wait for the next tick to allow async operations to complete
    await vi.runAllTimersAsync();
    await responsePromise;

    // Response should have been called with an array
    expect(sendResponse).toHaveBeenCalledWith(expect.any(Array));
  });

  it('should handle startSync message correctly', async () => {
    const sender = {};
    const sendResponse = vi.fn();

    const responsePromise = new Promise<void>((resolve) => {
      sendResponse.mockImplementation(() => {
        resolve();
        return true;
      });
    });

    const handled = messageListener(
      { type: 'startSync' },
      sender,
      sendResponse
    );

    expect(handled).toBe(true);
    await vi.runAllTimersAsync();
    await responsePromise;
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should handle stopSync message correctly', () => {
    const sender = {};
    const sendResponse = vi.fn();

    const handled = messageListener(
      { type: 'stopSync' },
      sender,
      sendResponse
    );

    expect(handled).toBe(false); // Should return false as it's synchronous
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });

  it('should handle unknown message types', () => {
    const sender = {};
    const sendResponse = vi.fn();

    const handled = messageListener(
      { type: 'unknownType' },
      sender,
      sendResponse
    );

    expect(handled).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({
      error: 'Unknown message type: unknownType'
    });
  });
});
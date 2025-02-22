import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      get: vi.fn(),
      set: vi.fn()
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

describe('BackgroundService', () => {
  let messageListener: Function;
  let service: BackgroundService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock HistorySync methods
    vi.mock('../src/services/HistorySync', () => ({
      HistorySync: vi.fn().mockImplementation(() => ({
        init: vi.fn().mockResolvedValue(undefined),
        getHistory: vi.fn().mockResolvedValue([]),
        startSync: vi.fn().mockResolvedValue(undefined),
        stopSync: vi.fn()
      }))
    }));

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

  it('should handle getHistory message correctly', async () => {
    // Create a mock sender and response callback
    const sender = {};
    const sendResponse = vi.fn();

    // Call the message listener with a getHistory message
    const handled = messageListener(
      { type: 'getHistory', limit: 50 },
      sender,
      sendResponse
    );

    // Should return true to keep the message port open
    expect(handled).toBe(true);

    // Wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Response should have been called with an array
    expect(sendResponse).toHaveBeenCalledWith(expect.any(Array));
  });
});
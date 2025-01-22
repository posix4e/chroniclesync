import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistoryManager } from '../history';
import { DB } from '../db';

// Mock chrome.runtime.sendMessage
const mockSendMessage = vi.fn();
global.chrome = {
  runtime: {
    sendMessage: mockSendMessage
  }
} as Partial<typeof chrome>;

// Mock window.history
const mockPushState = vi.fn();
const mockReplaceState = vi.fn();
const originalHistory = window.history;
Object.defineProperty(window, 'history', {
  value: {
    ...originalHistory,
    pushState: mockPushState,
    replaceState: mockReplaceState
  }
});

describe('HistoryManager', () => {
  let db: DB;
  let historyManager: HistoryManager;

  beforeEach(async () => {
    // Create a new DB instance with a unique client ID for each test
    db = new DB();
    await db.init('test-client-' + Date.now());
    historyManager = new HistoryManager(db);
    await historyManager.init();

    // Clear mocks
    mockSendMessage.mockClear();
    mockPushState.mockClear();
    mockReplaceState.mockClear();
  });

  afterEach(() => {
    historyManager.destroy();
    db.close();
  });

  it('should monitor pushState calls', async () => {
    const state = { page: 1 };
    const title = 'Test Page';
    const url = 'https://example.com/test';

    // Trigger pushState
    history.pushState(state, title, url);

    // Verify message was sent
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'HISTORY_UPDATED',
      action: 'pushState',
      data: { state, title, url },
      timestamp: expect.any(Number)
    });

    // Verify entry was stored in DB
    const entries = await db.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'pushState',
      data: { state, title, url }
    });
  });

  it('should monitor replaceState calls', async () => {
    const state = { page: 2 };
    const title = 'Updated Page';
    const url = 'https://example.com/updated';

    // Trigger replaceState
    history.replaceState(state, title, url);

    // Verify message was sent
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'HISTORY_UPDATED',
      action: 'replaceState',
      data: { state, title, url },
      timestamp: expect.any(Number)
    });

    // Verify entry was stored in DB
    const entries = await db.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'replaceState',
      data: { state, title, url }
    });
  });

  it('should handle popstate events', async () => {
    // Simulate popstate event
    const state = { page: 3 };
    window.dispatchEvent(new PopStateEvent('popstate', { state }));

    // Verify message was sent
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'HISTORY_UPDATED',
      action: 'popstate',
      data: {
        state,
        title: document.title,
        url: window.location.href
      },
      timestamp: expect.any(Number)
    });

    // Verify entry was stored in DB
    const entries = await db.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'popstate',
      data: {
        state,
        title: document.title,
        url: window.location.href
      }
    });
  });

  it('should queue changes when offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', { value: false });

    const state = { page: 4 };
    const title = 'Offline Page';
    const url = 'https://example.com/offline';

    // Trigger pushState while offline
    history.pushState(state, title, url);

    // Verify no message was sent
    expect(mockSendMessage).not.toHaveBeenCalled();

    // Verify entry was still stored in DB
    const entries = await db.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'pushState',
      data: { state, title, url }
    });

    // Restore online state
    Object.defineProperty(navigator, 'onLine', { value: true });
  });

  it('should apply remote changes', async () => {
    const remoteEntries = [
      {
        action: 'pushState',
        data: {
          state: { page: 5 },
          title: 'Remote Page',
          url: 'https://example.com/remote'
        },
        timestamp: Date.now()
      }
    ];

    await historyManager.applyRemoteChanges(remoteEntries);

    // Verify entries were stored in DB
    const entries = await db.getHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: 'pushState',
      data: remoteEntries[0].data
    });

    // Verify history was updated
    expect(mockPushState).toHaveBeenCalledWith(
      remoteEntries[0].data.state,
      remoteEntries[0].data.title,
      remoteEntries[0].data.url
    );
  });
});
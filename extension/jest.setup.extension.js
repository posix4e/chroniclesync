import { vi } from 'vitest';

// Create a mock wordList for testing
global.wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'art'];

// Mock Chrome Extension API
global.chrome = {
  runtime: {
    getManifest: () => ({
      manifest_version: 3,
      version: '1.0'
    }),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn()
    },
    getURL: vi.fn((path) => `chrome-extension://mock-extension-id/${path}`)
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        if (typeof callback === 'function') {
          callback({});
        }
        return Promise.resolve({});
      }),
      set: vi.fn((data, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return Promise.resolve();
      })
    },
    sync: {
      get: vi.fn((keys, callback) => {
        if (typeof callback === 'function') {
          callback({
            mnemonic: 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress art',
            clientId: 'test-client-id',
            environment: 'production',
            expirationDays: 7,
            syncMode: 'p2p',
            iceServerProvider: 'google'
          });
        }
        return Promise.resolve({
          mnemonic: 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress art',
          clientId: 'test-client-id',
          environment: 'production',
          expirationDays: 7,
          syncMode: 'p2p',
          iceServerProvider: 'google'
        });
      }),
      set: vi.fn((data, callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return Promise.resolve();
      })
    }
  }
};
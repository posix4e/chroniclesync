import { vi } from 'vitest';

// Mock browser extension APIs
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getURL: vi.fn(path => `chrome-extension://mockextensionid/${path}`),
    getManifest: vi.fn(() => ({ version: '1.0.0' }))
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn()
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
};

// Mock fetch API
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    status: 200,
    statusText: 'OK'
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn(index => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(),
          add: vi.fn(),
          get: vi.fn(),
          delete: vi.fn(),
          clear: vi.fn(),
          getAll: vi.fn(),
          index: vi.fn(() => ({
            get: vi.fn(),
            getAll: vi.fn()
          }))
        }))
      })),
      createObjectStore: vi.fn(),
      deleteObjectStore: vi.fn()
    }
  }))
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB
});

// Mock WebRTC APIs for P2P testing
global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
  createOffer: vi.fn().mockResolvedValue({}),
  createAnswer: vi.fn().mockResolvedValue({}),
  setLocalDescription: vi.fn().mockResolvedValue({}),
  setRemoteDescription: vi.fn().mockResolvedValue({}),
  addIceCandidate: vi.fn().mockResolvedValue({}),
  close: vi.fn(),
  onicecandidate: null,
  oniceconnectionstatechange: null,
  onicegatheringstatechange: null,
  onsignalingstatechange: null,
  ontrack: null,
  ondatachannel: null,
  getStats: vi.fn().mockResolvedValue(new Map()),
  getSenders: vi.fn().mockReturnValue([]),
  getReceivers: vi.fn().mockReturnValue([]),
  createDataChannel: vi.fn().mockReturnValue({
    send: vi.fn(),
    close: vi.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
  })
}));

// Mock crypto APIs
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      sign: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      verify: vi.fn().mockResolvedValue(true),
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      generateKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      importKey: vi.fn().mockResolvedValue({}),
      exportKey: vi.fn().mockResolvedValue({})
    },
    getRandomValues: vi.fn(array => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock P2P functions used in tests
global.window.disconnectP2P = vi.fn().mockResolvedValue(undefined);
global.window.reconnectP2P = vi.fn().mockResolvedValue(undefined);
global.window.isPeerAuthenticated = vi.fn().mockResolvedValue(true);
global.window.connectWithInvalidCredentials = vi.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
global.window.addData = vi.fn().mockResolvedValue(undefined);
global.window.getData = vi.fn().mockResolvedValue({ id: 'test-id', value: 'test-value' });
global.window.updateData = vi.fn().mockResolvedValue(undefined);
global.window.checkDataExists = vi.fn().mockResolvedValue(true);
global.window.addBatchData = vi.fn().mockResolvedValue(undefined);
global.window.addDataWithIntegrity = vi.fn().mockResolvedValue(undefined);
global.window.verifyDataIntegrity = vi.fn().mockResolvedValue({ valid: true, hash: 'mock-hash' });
global.window.simulateDataTampering = vi.fn().mockResolvedValue({ detected: true });
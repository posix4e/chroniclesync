/**
 * Common test setup and utilities for both extension and pages
 */

// Mock for chrome.storage API
export const createChromeStorageMock = () => {
  const storage: Record<string, any> = {};
  
  return {
    sync: {
      get: jest.fn((keys, callback) => {
        if (typeof callback === 'function') {
          const result: Record<string, any> = {};
          if (Array.isArray(keys)) {
            keys.forEach(key => {
              if (storage[key]) result[key] = storage[key];
            });
          } else if (typeof keys === 'string') {
            if (storage[keys]) result[keys] = storage[keys];
          } else if (typeof keys === 'object') {
            Object.keys(keys).forEach(key => {
              result[key] = storage[key] || keys[key];
            });
          }
          callback(result);
        }
        return Promise.resolve(storage);
      }),
      set: jest.fn((items, callback) => {
        Object.assign(storage, items);
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      }),
      remove: jest.fn((keys, callback) => {
        if (Array.isArray(keys)) {
          keys.forEach(key => delete storage[key]);
        } else {
          delete storage[keys];
        }
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      }),
      clear: jest.fn((callback) => {
        Object.keys(storage).forEach(key => delete storage[key]);
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      })
    }
  };
};

// Common fetch mock
export const createFetchMock = (response: any = {}, ok: boolean = true) => {
  return jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    })
  );
};
// Mock Chrome API
const chrome = {
  history: {
    search: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn()
  }
};

// Add Chrome to global scope
(global as any).chrome = chrome;

// Add TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
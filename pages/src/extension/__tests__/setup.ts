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
// Add TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';

// Extend global with our mocks
Object.assign(global, {
  chrome,
  TextEncoder,
  TextDecoder
});
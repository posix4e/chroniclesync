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
interface ExtendedGlobal extends NodeJS.Global {
  chrome: typeof chrome;
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
}

(global as ExtendedGlobal).chrome = chrome;

// Add TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
(global as ExtendedGlobal).TextEncoder = TextEncoder;
(global as ExtendedGlobal).TextDecoder = TextDecoder;
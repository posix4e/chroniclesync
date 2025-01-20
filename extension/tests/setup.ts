// Mock chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  history: {
    search: jest.fn(),
    onVisited: {
      addListener: jest.fn(),
    },
  },
} as unknown as typeof chrome;

// Mock TextEncoder/TextDecoder
class MockTextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input));
  }
}

class MockTextDecoder {
  decode(input: Uint8Array): string {
    return Buffer.from(input).toString();
  }
}

// @ts-ignore
global.TextEncoder = MockTextEncoder;
// @ts-ignore
global.TextDecoder = MockTextDecoder;

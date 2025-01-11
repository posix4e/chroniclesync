// Test output handler
const testOutput = {
  log: (message) => process.stdout.write(message + '\n'),
  error: (message) => process.stderr.write(message + '\n')
};

// Simple test utilities
export function describe(name, fn) {
  testOutput.log(`\n${name}`);
  fn();
}

export function it(name, fn) {
  try {
    fn();
    testOutput.log(`  ✓ ${name}`);
  } catch (error) {
    testOutput.error(`  ✗ ${name}`);
    testOutput.error(`    ${error.message}`);
    throw error;
  }
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeCalled() {
      if (actual.mock.calls.length === 0) {
        throw new Error('Expected function to be called');
      }
    }
  };
}

// Simple mocking utilities
export function createMockFetch(responses) {
  return async function mockFetch(url, options) {
    const response = responses[url] || responses.default;
    if (typeof response === 'function') {
      return response(url, options);
    }
    return {
      ok: true,
      json: async () => response,
      ...response
    };
  };
}

export function mockElement(responses = {}) {
  return {
    textContent: '',
    className: '',
    value: '',
    ...responses
  };
}

// DOM mocking utilities
export function setupDomMocks() {
  const elements = {};
  global.document = {
    getElementById: (id) => elements[id] || mockElement(),
    querySelector: (selector) => elements[selector] || mockElement()
  };
  global.window = {
    location: {
      hostname: 'chroniclesync.xyz'
    }
  };
  return {
    elements,
    mockElement: (id, element) => {
      elements[id] = element;
    }
  };
}
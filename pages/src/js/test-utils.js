// Simple test utilities
export function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

export function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.error(`  ✗ ${name}`);
        console.error(`    ${error.message}`);
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
    global.document = {
        getElementById: (id) => mockElement(),
        querySelector: (selector) => mockElement()
    };
    global.window = {
        location: {
            hostname: 'chroniclesync.xyz'
        }
    };
    return {
        elements: {},
        mockElement: (id, element) => {
            global.document.getElementById = (testId) => 
                testId === id ? element : mockElement();
        }
    };
}
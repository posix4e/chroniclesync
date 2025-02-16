module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^src/utils/encryption$': '<rootDir>/src/utils/__mocks__/encryption.ts',
    '^bip32$': '<rootDir>/src/utils/__mocks__/encryption.ts',
    '^tiny-secp256k1$': '<rootDir>/src/utils/__mocks__/encryption.ts'
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', { rootMode: 'upward' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uint8array-tools|bip32|tiny-secp256k1)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

};
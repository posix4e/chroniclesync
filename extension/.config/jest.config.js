/**
 * Unified Jest configuration
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  extensionConfig: {
    // Extension-specific configuration
    setupFiles: ['<rootDir>/tests/extension-setup.js'],
    testEnvironment: 'jsdom',
    testMatch: [
      '<rootDir>/src/**/*.extension.test.(ts|tsx|js|jsx)',
      '<rootDir>/tests/extension/**/*.test.(ts|tsx|js|jsx)',
    ],
  }
};
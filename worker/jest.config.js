module.exports = {
  testEnvironment: 'jest-environment-miniflare',
  testEnvironmentOptions: {
    modules: true,
    kvNamespaces: ['METADATA'],
    r2Buckets: ['STORAGE'],
    bindings: {
      ADMIN_PASSWORD: 'francesisthebest'
    }
  },
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
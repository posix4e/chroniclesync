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
      branches: 85,
      functions: 85,
      lines: 75,
      statements: 75,
    },
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
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
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 85,
      statements: 85,
    },
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
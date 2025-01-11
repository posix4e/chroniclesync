module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: ['src/js/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }],
  },
  setupFiles: ['./jest.setup.js'],
};
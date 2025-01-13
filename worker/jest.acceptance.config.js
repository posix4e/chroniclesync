module.exports = {
  testMatch: ['**/__acceptance_tests__/**/*.test.js'],
  testTimeout: 60000, // Longer timeout for integration tests
  setupFilesAfterEnv: ['./jest.acceptance.setup.js'],
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'acceptance-junit.xml',
    }],
  ],
};
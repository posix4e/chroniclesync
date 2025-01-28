const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: [
    '**/__tests__/**/*.extension.test.[jt]s?(x)',
  ],
  setupFilesAfterEnv: [
    './jest.setup.js',
    './jest.setup.extension.js'
  ],
  globals: {
    chrome: {
      runtime: {},
      tabs: {},
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    }
  }
};
import baseConfig from './jest.config.js';

export default {
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
          get: () => {},
          set: () => {}
        }
      }
    }
  }
};
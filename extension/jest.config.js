module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.extension.test.[jt]s?(x)',
  ],
  setupFilesAfterEnv: [
    './jest.setup.extension.js'
  ]
};
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true, // Add support for Chrome extension APIs
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
    },
    {
      files: [
        '**/e2e/**/*',
        '**/scripts/**/*',
        '**/playwright.config.ts'
      ],
      rules: {
        'no-console': 'off'
      }
    }
  ],
};
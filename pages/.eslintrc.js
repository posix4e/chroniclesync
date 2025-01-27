module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'varsIgnorePattern': '^(_|DB|initializeClient|saveData|loginAdmin|deleteClient|viewClientData|triggerWorkflow|checkSystemStatus)', 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-unused-vars': ['error', { 'varsIgnorePattern': '^(_|DB|initializeClient|saveData|loginAdmin|deleteClient|viewClientData|triggerWorkflow|checkSystemStatus)', 'argsIgnorePattern': '^_' }],
  },
  globals: {
    DB: 'readonly',
    initializeClient: 'readonly',
    saveData: 'readonly',
    syncData: 'readonly',
    loginAdmin: 'readonly',
    refreshStats: 'readonly',
    deleteClient: 'readonly',
    viewClientData: 'readonly',
    triggerWorkflow: 'readonly',
    checkSystemStatus: 'readonly',
    formatBytes: 'readonly',
  },
  overrides: [
    {
      // Allow console.log in test files
      files: ['**/*.spec.ts', '**/*.test.ts'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      // Allow console.log in background scripts
      files: ['**/background.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
};
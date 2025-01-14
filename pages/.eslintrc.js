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
    'no-unused-vars': ['error', { 'varsIgnorePattern': '^(DB|initializeClient|saveData|loginAdmin|deleteClient|viewClientData|triggerWorkflow|checkSystemStatus)$' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
  },
  overrides: [
    {
      // Allow console.log in test files
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
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
    importScripts: 'readonly',
    JSX: 'readonly',
  },
};
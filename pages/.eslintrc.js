module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['error', { 'varsIgnorePattern': '^(DB|initializeClient|saveData|loginAdmin|deleteClient|viewClientData|triggerWorkflow|checkSystemStatus)$' }],
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
};
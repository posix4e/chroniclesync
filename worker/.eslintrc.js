module.exports = {
  globals: {
    getMiniflareBindings: 'readonly',
    getMiniflareKVNamespace: 'readonly',
    getMiniflareR2Bucket: 'readonly'
  },
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
    'no-console': 'off',
  },
};
# OpenHands Setup Guide for ChronicleSync

## Initial Setup

```bash
# Install system dependencies
sudo apt-get update && sudo apt-get install -y zip unzip

# Install Node.js 18
nvm install 18 && nvm use 18

# Install dependencies for both components
cd /workspace/chroniclesync/pages && npm ci
cd /workspace/chroniclesync/worker && npm ci

# Install Playwright for E2E tests
cd /workspace/chroniclesync/pages && npx playwright install chromium --with-deps
```

## Package Management

If you modify package.json:
1. Run `npm install` (not `npm ci`) to update package-lock.json
2. Commit both files:
   ```bash
   git add package.json package-lock.json
   git commit -m "Update dependencies: DESCRIBE_CHANGES"
   ```
3. Run tests to verify the updates don't break anything

## Why Complete Test Sequence Matters

When fixing tests, the sequence of validation is crucial:

```
lint -> test -> build
```

This sequence must complete without errors because:
1. Fixing a test often means adding/changing code
2. Those changes can break linting rules
3. A failing lint check means the code isn't ready to push
4. Skipping any step risks pushing broken code

Example:
```typescript
// 1. Test fails because error isn't handled
async function getData() {
  return fetch('/data');  // Missing error handling
}

// 2. Fix the test by adding error handling
async function getData() {
  try {
    return fetch('/data');
  } catch (error) {
    console.log(error);  // Lint will fail: console.log not allowed
  }
}

// 3. Fix the lint error
async function getData() {
  try {
    return fetch('/data');
  } catch (error) {
    logError(error);  // Now both test and lint pass
  }
}
```

## Validation Commands

```bash
# Pages component
cd /workspace/chroniclesync/pages && \
npm run lint && \
npm run test && \
npm run build:web && \

# Worker component
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage
```

All commands must succeed. A failure at any step means the code needs more work.

## Platform-Specific Extension Testing

OpenHands runs on Linux and can test:
- Chrome extension (fully)
- Firefox extension (fully)
- Web app (fully)
- Service worker (fully)

Cannot test:
- Safari extension (macOS only)
- Browser-specific extension signing
- Extension store submissions

For complete extension testing:
1. Linux/Windows: Test Chrome and Firefox builds
2. macOS: Test Safari build
3. CI will test all platforms
4. Extension store submissions must be done manually on each platform

## Environment Variables

Required for full testing:
```bash
# Set these before running tests
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"

# Optional: Enable debug logging
export DEBUG="pw:api*"  # For Playwright debugging
```

## Clean State Testing

Before running tests, ensure clean state:
```bash
# Clear previous builds
cd /workspace/chroniclesync/pages
rm -rf dist/* test-results/* playwright-report/*

# Clear dependency caches
cd /workspace/chroniclesync/pages && npm ci
cd /workspace/chroniclesync/worker && npm ci

# Run the validation sequence
npm run lint && npm run test && npm run build:web
```
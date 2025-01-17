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

## Test Sequence and Validation

When fixing tests, the sequence of validation is crucial and must be run twice:

```
First Pass:  lint -> test -> build
Second Pass: lint -> test -> build
```

This double validation is required because:
1. Fixing a test often means adding/changing code
2. Those changes can break linting rules or introduce new test failures
3. Running the sequence once might pass, but subsequent runs could fail
4. Double validation catches cascading issues and ensures stability

For example:
- First pass: Fix a test by adding error handling
- Second pass: Verify the fix didn't break other tests or linting
- If both passes succeed, the changes are stable

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

Each component must be validated twice to ensure stability:

```bash
# First Pass - Pages Component
cd /workspace/chroniclesync/pages && \
npm run lint && \
npm run test && \
npm run build:web && \
npm run test:extension  # Test browser extensions

# First Pass - Worker Component
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage

# Second Pass - Pages Component
cd /workspace/chroniclesync/pages && \
npm run lint && \
npm run test && \
npm run build:web && \
npm run test:extension  # Verify extension tests still pass

# Second Pass - Worker Component
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage
```

All commands must succeed in both passes. A failure at any step means the code needs more work.

### Extension Testing Requirements

The extension tests (`npm run test:extension`) include:
- Service worker functionality
- Background script behavior
- Content script integration
- Cross-origin messaging
- IndexedDB operations
- Browser API interactions

Common extension test failures:
- Race conditions in service worker registration
- Async/await timing issues
- Cross-origin permission problems
- IndexedDB transaction conflicts
- Browser API mock inconsistencies

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

For local testing:
```bash
# Only for Playwright debugging
export DEBUG="pw:api*"
```

## Deployment Commands (Do Not Run in OpenHands)

OpenHands cannot deploy to Cloudflare. These commands must be run in your local environment or via GitHub Actions:

```bash
# Pages deployment (run locally or in CI)
cd pages && npm run deploy -- --branch YOUR_BRANCH

# Worker deployment (run locally or in CI)
cd worker && npm run deploy -- --env staging

# Required environment variables for deployment:
export CLOUDFLARE_API_TOKEN="your_token"
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
```

⚠️ **Important**: 
- OpenHands should NOT run deployment commands
- Let GitHub Actions handle deployments to staging/production
- For local testing, run these commands in your own environment

## Clean State Testing

Before running tests, ensure clean state:
```bash
# Clear previous builds and test artifacts
cd /workspace/chroniclesync/pages
rm -rf dist/* test-results/* playwright-report/* coverage/*

# Clear dependency caches
cd /workspace/chroniclesync/pages && npm ci
cd /workspace/chroniclesync/worker && npm ci

# Clear browser test profiles
rm -rf ~/.config/chromium-test-profile
rm -rf ~/.mozilla/firefox-test-profile

# Run both validation passes
echo "First validation pass..."
npm run lint && npm run test && npm run build:web && npm run test:extension

echo "Second validation pass..."
npm run lint && npm run test && npm run build:web && npm run test:extension
```

### Common Test Environment Issues

If tests fail in CI but pass locally:
1. Clear all caches and artifacts (as shown above)
2. Ensure Node.js version matches CI (v18)
3. Check for race conditions with `DEBUG="pw:api*"`
4. Verify browser versions match CI environment
5. Run tests multiple times to catch intermittent failures
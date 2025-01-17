# OpenHands Setup Guide for ChronicleSync

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
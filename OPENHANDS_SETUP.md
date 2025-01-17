# OpenHands Setup Guide for ChronicleSync

This guide contains the setup and testing commands for working with the ChronicleSync repository.

⚠️ **IMPORTANT: Run the validation sequence TWICE** ⚠️

When making changes, you must run the full validation sequence twice because:
1. Fixing test failures often involves adding new code or modifying existing code
2. These fixes can introduce new linting issues
3. Running lint->test->lint catches issues that would be missed by a single pass

## Environment Setup

```bash
# System dependencies
sudo apt-get update && \
sudo apt-get install -y zip unzip && \

# Node.js setup (assuming nvm is installed)
nvm install 18 && \
nvm use 18 && \

# Pages setup
cd /workspace/chroniclesync/pages && \
npm ci && \

# Worker setup
cd /workspace/chroniclesync/worker && \
npm ci && \

# Install Playwright for E2E tests
cd /workspace/chroniclesync/pages && \
npx playwright install chromium --with-deps && \

# Create necessary directories for test results
mkdir -p test-results playwright-report
```

## Testing and Validation Commands

You MUST run this sequence TWICE to ensure no regressions:

```bash
# First pass: Initial validation
echo "🔍 First validation pass..."

# Pages component
cd /workspace/chroniclesync/pages && \
npm run lint && \
tsc --noEmit && \  # TypeScript type check without emitting files
npm run test && \

# Build and test extensions
BROWSER=chrome npm run build:extensions && \
npm run package:chrome && \
BROWSER=firefox npm run build:extensions && \
npm run package:firefox && \
BROWSER=safari npm run build:extensions && \
npm run package:safari && \

# Worker component
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage && \

# E2E tests
cd /workspace/chroniclesync/pages && \
TEST_TYPE=extension npm run test:e2e && \
npm run build:web && \

# Second pass: Verify no new issues
echo "🔍 Second validation pass..." && \

# Pages component again
cd /workspace/chroniclesync/pages && \
npm run lint && \
tsc --noEmit && \  # TypeScript type check again to catch issues from test fixes
npm run test && \

# Build and test extensions again
BROWSER=chrome npm run build:extensions && \
npm run package:chrome && \
BROWSER=firefox npm run build:extensions && \
npm run package:firefox && \
BROWSER=safari npm run build:extensions && \
npm run package:safari && \

# Worker component again
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage && \

# E2E tests again
cd /workspace/chroniclesync/pages && \
TEST_TYPE=extension npm run test:e2e && \
npm run build:web
```

## Important Notes

1. Why run everything twice?
   - Fixing test failures often requires code changes
   - These changes can introduce new linting issues
   - Example: Adding a new variable to fix a test might create an unused variable warning
   - Running the sequence twice catches these cascading issues

2. Common issues caught by the second pass:
   - Unused variables from test fixes
   - Missing type annotations
   - Improper error handling patterns
   - Inconsistent async/await usage
   - Build issues from test-driven changes
   - TypeScript type errors in test mocks
   - Incorrect type assertions in tests
   - Missing type declarations for global objects

3. Project components:
   - Pages (frontend/extension)
   - Worker (backend service worker)

4. Testing coverage:
   - Linting for code quality
   - Unit tests for functionality
   - E2E tests for integration
   - Coverage reporting for completeness

5. Build artifacts:
   - Web app
   - Chrome extension
   - Firefox extension
   - Safari extension

Remember: A single pass might give you passing tests but leave linting issues. Always run the full sequence twice!
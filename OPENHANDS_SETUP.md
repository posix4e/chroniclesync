# OpenHands Setup Guide for ChronicleSync

This guide contains the setup and testing commands for working with the ChronicleSync repository.

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

```bash
# Start with Pages testing
cd /workspace/chroniclesync/pages && \
npm run lint && \
npm run test && \

# Build and test extensions for all browsers
BROWSER=chrome npm run build:extensions && \
npm run package:chrome && \
BROWSER=firefox npm run build:extensions && \
npm run package:firefox && \
BROWSER=safari npm run build:extensions && \
npm run package:safari && \

# Worker tests with coverage
cd /workspace/chroniclesync/worker && \
npm run lint && \
npm run test:coverage && \

# E2E tests for extension
cd /workspace/chroniclesync/pages && \
TEST_TYPE=extension npm run test:e2e && \

# Build web app
npm run build:web
```

## Important Notes

1. The project has two main components:
   - Pages (frontend/extension)
   - Worker (backend service worker)

2. Testing includes:
   - Linting for both components
   - Unit tests for both components
   - E2E tests for the extension
   - Coverage reporting for the worker

3. The build process includes:
   - Web app build
   - Extension builds for Chrome, Firefox, and Safari
   - Extension packaging

4. Each command in the chains ensures:
   - All dependencies are properly installed
   - Tests are run in a logical order
   - Each step must succeed before moving to the next
   - Maximum test coverage is achieved through multiple test types
   - All browser extensions are properly built and tested
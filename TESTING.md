# ChronicleSync Testing Plan

## Overview

This document outlines the testing strategy for ChronicleSync, focusing on browser extension testing in both local and CI environments.

## Test Environment Setup

### Local Development
1. Node.js and Dependencies
   ```bash
   nvm use 18  # Match CI Node.js version
   npm ci      # Use clean install
   ```

2. Browser Requirements
   - Chrome/Chromium for extension testing
   - Firefox for cross-browser validation
   - Clean browser profiles for testing

3. System Dependencies
   ```bash
   sudo apt-get update
   sudo apt-get install -y zip unzip chromium-browser firefox
   ```

### CI Environment
1. System Setup
   - Ubuntu Latest
   - Node.js 18
   - Chromium for Playwright
   - Clean state for each run

2. Required Secrets
   - `GITHUB_TOKEN` for releases
   - `CLOUDFLARE_API_TOKEN` for deployments
   - `CLOUDFLARE_ACCOUNT_ID` for deployments

## Testing Sequence

### 1. Pre-Build Validation
```bash
# Clear previous state
rm -rf dist/* test-results/* playwright-report/* coverage/*
rm -rf ~/.config/chromium-test-profile ~/.mozilla/firefox-test-profile

# Install dependencies
npm ci

# First validation pass
npm run lint
npm run test
npm run build:web

# Second validation pass
npm run lint
npm run test
npm run build:web
```

### 2. Extension Building
```bash
# Build for each browser
for BROWSER in chrome firefox safari; do
  BROWSER=$BROWSER npm run build:extensions
  
  # Verify build artifacts
  test -d "dist/$BROWSER" || exit 1
  test -f "dist/$BROWSER/manifest.json" || exit 1
  
  # Package extension
  npm run "package:$BROWSER"
done
```

### 3. Extension Testing
```bash
# Install Playwright
npx playwright install chromium --with-deps

# Run E2E tests
TEST_TYPE=extension npm run test:e2e
```

## Test Categories

### 1. Unit Tests
- Background script functionality
- Service worker operations
- Storage operations
- API interactions

### 2. Integration Tests
- Cross-origin messaging
- Browser API interactions
- History synchronization
- Error handling

### 3. E2E Tests
- Extension installation
- Service worker registration
- Background page initialization
- History syncing workflow

## Common Failure Points

### 1. Service Worker Issues
- Registration timing
- Lifecycle events
- Cross-origin access
- Permission grants

### 2. Browser API Access
- Storage permissions
- History access
- Runtime availability
- API versioning

### 3. Build Problems
- Manifest version compatibility
- Asset paths
- Permission declarations
- Content script injection

### 4. CI Environment
- Browser version mismatches
- System dependency issues
- Network access problems
- Resource constraints

## Debugging Strategies

### 1. Local Testing
```bash
# Enable debug logging
DEBUG="pw:api*" npm run test:e2e

# Check extension build
ls -la dist/chrome/
cat dist/chrome/manifest.json

# Verify browser setup
ls -la ~/.config/chromium-test-profile/
```

### 2. CI Testing
```bash
# Verify environment
node --version
chromium --version

# Check build artifacts
ls -la dist/
cat dist/chrome/manifest.json

# Enable verbose logging
DEBUG="pw:*" npm run test:e2e
```

## Test Result Analysis

### 1. Success Criteria
- All unit tests pass
- E2E tests pass in CI
- No TypeScript errors
- No ESLint warnings
- Clean build artifacts

### 2. Required Artifacts
- Extension packages
- Test reports
- Coverage reports
- Build logs

### 3. Common Issues
1. Service Worker
   - Not registering in time
   - Missing permissions
   - Lifecycle issues
   - Cross-origin problems

2. Browser APIs
   - Permission denials
   - API version mismatches
   - Timing issues
   - Resource limits

3. Build Process
   - Missing files
   - Invalid manifests
   - Dependency issues
   - Asset paths

4. CI Environment
   - Resource constraints
   - Network issues
   - Version mismatches
   - Permission problems

## Continuous Improvement

### 1. Test Coverage
- Track coverage metrics
- Identify untested paths
- Add missing test cases
- Update test documentation

### 2. CI Pipeline
- Monitor build times
- Track failure patterns
- Optimize resource usage
- Update dependencies

### 3. Documentation
- Keep testing docs current
- Document common issues
- Update debugging guides
- Maintain troubleshooting tips